let nerdamerPromise;
const getNerdamer = () =>
  (nerdamerPromise ??= Promise.all([
    import("nerdamer"),
    import("nerdamer/Algebra.js"),
    import("nerdamer/Calculus.js"),
    import("nerdamer/Solve.js"),
  ]).then(([module]) => module.default ?? module));

function normalizeSymbolic(source) {
  return String(source)
    .replaceAll("π", "pi")
    .replaceAll("−", "-")
    .replaceAll("²", "^2")
    .replaceAll("³", "^3")
    .replace(/×/g, "*")
    .replace(/÷/g, "/");
}

function unwrapOuterParentheses(source) {
  if (!source.startsWith("(") || !source.endsWith(")")) return source;
  let depth = 0;
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === "(") depth += 1;
    else if (source[index] === ")") depth -= 1;
    if (depth === 0 && index < source.length - 1) return source;
  }
  return source.slice(1, -1);
}

function equationResidual(source) {
  const match = source.match(/^(.+?)=(?!=)(.+)$/);
  return match ? `(${match[1]})-(${match[2]})` : source;
}

function isExactSolution(nerdamer, source, variable, root) {
  try {
    return (
      nerdamer(equationResidual(source))
        .evaluate({ [variable]: root })
        .toString() === "0"
    );
  } catch {
    return false;
  }
}

function isExactSystemSolution(nerdamer, equations, assignments) {
  try {
    const scope = Object.fromEntries(
      assignments.map(([variable, value]) => [variable, String(value)]),
    );
    return equations.every(
      (equation) =>
        nerdamer(equationResidual(equation)).evaluate(scope).toString() === "0",
    );
  } catch {
    return false;
  }
}

function withApproximation(nerdamer, exact, exactSolution = true) {
  try {
    const numeric = Number(
      nerdamer(exact).evaluate().text("decimals", 12).toString(),
    );
    if (
      !Number.isFinite(numeric) ||
      (exactSolution &&
        Math.abs(numeric - Math.round(numeric)) <=
          1e-12 * Math.max(1, Math.abs(numeric)))
    )
      return exactSolution ? exact : `≈ ${exact}`;
    if (!exactSolution) return `≈ ${Number(numeric.toPrecision(10))}`;
    return `${exact} ≈ ${Number(numeric.toPrecision(10))}`;
  } catch {
    return exact;
  }
}

export async function symbolicMath(source, operation, bounds = {}) {
  const expression = normalizeSymbolic(source.trim());
  if (!expression) throw new Error("Escribe una expresión para comenzar.");
  const nerdamer = await getNerdamer();
  let op = operation;
  if (op === "auto") {
    if (/^d\/dx/i.test(expression)) op = "derivative";
    else if (/^∫/.test(expression)) op = "integral";
    else if (/^lim\s*\(/i.test(expression)) op = "limit";
    else if (/(?:<=|>=|<|>)/.test(expression)) op = "inequality";
    else if (expression.includes("=")) op = "solve";
    else op = "simplify";
  }
  const variable = String(bounds.variable || "x").trim();
  if (!/^[a-zA-Z][a-zA-Z0-9_]{0,15}$/.test(variable))
    throw new Error("El nombre de variable debe empezar con una letra.");

  if (op === "inequality") {
    const match = expression.match(/^(.+?)(<=|>=|<|>)(.+)$/);
    if (!match) throw new Error("Formato esperado: x^2 - 4 >= 0");
    const [, left, relation, right] = match;
    const difference = nerdamer(`(${left})-(${right})`).expand().toString();
    if (
      /[/*]/.test(difference) ||
      /\b(?:sin|cos|tan|log|sqrt|abs|exp)\s*\(/i.test(difference)
    )
      throw new Error(
        "La desigualdad numérica solo admite polinomios de una variable, sin fracciones.",
      );
    const rootSource = nerdamer.solve(difference, variable).toString();
    const rawRoots =
      rootSource.startsWith("[") && rootSource.endsWith("]")
        ? rootSource.slice(1, -1).split(",").filter(Boolean)
        : rootSource && rootSource !== "[]"
          ? [rootSource]
          : [];
    const roots = [];
    for (const root of rawRoots) {
      if (/\bi\b|[0-9]i/.test(root)) continue;
      const numeric = Number(
        nerdamer(root).evaluate().text("decimals", 14).toString(),
      );
      if (!Number.isFinite(numeric))
        throw new Error(
          "No se pudieron evaluar numéricamente todas las raíces reales.",
        );
      roots.push(numeric);
    }
    roots.sort((a, b) => a - b);
    const uniqueRoots = roots.filter(
      (root, index) => index === 0 || Math.abs(root - roots[index - 1]) > 1e-9,
    );
    const samples = [];
    if (uniqueRoots.length === 0) samples.push(0);
    else {
      const first = uniqueRoots[0];
      samples.push(Number.isFinite(first - 1) ? first - 1 : first / 2);
      for (let i = 0; i < uniqueRoots.length - 1; i += 1)
        samples.push(uniqueRoots[i] / 2 + uniqueRoots[i + 1] / 2);
      const last = uniqueRoots.at(-1);
      samples.push(Number.isFinite(last + 1) ? last + 1 : last / 2);
    }
    const testRelation = (value) =>
      relation === ">"
        ? value > 0
        : relation === ">="
          ? value >= 0
          : relation === "<"
            ? value < 0
            : value <= 0;
    const selectedSegments = [];
    for (let index = 0; index < samples.length; index += 1) {
      const value = Number(
        nerdamer(difference)
          .evaluate({ [variable]: samples[index] })
          .text("decimals", 14)
          .toString(),
      );
      if (!Number.isFinite(value))
        throw new Error("No se pudo evaluar la desigualdad en un intervalo.");
      selectedSegments.push(testRelation(value));
    }
    const inclusive = relation.endsWith("=");
    const intervals = [];
    for (let index = 0; index < selectedSegments.length; index += 1) {
      if (!selectedSegments[index]) continue;
      intervals.push({
        low: index === 0 ? -Infinity : uniqueRoots[index - 1],
        high:
          index === selectedSegments.length - 1 ? Infinity : uniqueRoots[index],
        lowClosed: index > 0 && inclusive,
        highClosed: index < selectedSegments.length - 1 && inclusive,
      });
    }
    if (inclusive) {
      for (let index = 0; index < uniqueRoots.length; index += 1) {
        if (!selectedSegments[index] && !selectedSegments[index + 1])
          intervals.push({
            low: uniqueRoots[index],
            high: uniqueRoots[index],
            lowClosed: true,
            highClosed: true,
          });
      }
    }
    intervals.sort((a, b) => a.low - b.low);
    const merged = [];
    for (const interval of intervals) {
      const previous = merged.at(-1);
      if (
        previous &&
        previous.high === interval.low &&
        previous.highClosed &&
        interval.lowClosed
      ) {
        previous.high = interval.high;
        previous.highClosed = interval.highClosed;
      } else merged.push({ ...interval });
    }
    const formatInterval = ({ low, high, lowClosed, highClosed }) => {
      if (low === high) return `{${low}}`;
      return `${lowClosed ? "[" : "("}${low === -Infinity ? "−∞" : low}, ${high === Infinity ? "∞" : high}${highClosed ? "]" : ")"}`;
    };
    return {
      title: "Solución de la desigualdad",
      lines: [merged.length ? merged.map(formatInterval).join(" ∪ ") : "∅"],
      note: "Solución por intervalos numéricos; se admiten polinomios de una variable.",
    };
  }

  if (op === "sum") {
    const lower = Number(bounds.lower);
    const upper = Number(bounds.upper);
    if (
      String(bounds.lower ?? "").trim() === "" ||
      String(bounds.upper ?? "").trim() === "" ||
      !Number.isSafeInteger(lower) ||
      !Number.isSafeInteger(upper) ||
      lower > upper ||
      upper - lower > 10000
    )
      throw new Error(
        "Usa límites enteros con a ≤ b y como máximo 10 001 términos.",
      );
    const { evaluateMath } = await import("./math-engine.js");
    let total = 0;
    for (let value = lower; value <= upper; value += 1) {
      const term = evaluateMath(expression, { [variable]: value }, "RAD");
      if (typeof term !== "number" || !Number.isFinite(term))
        throw new Error(
          `El término para ${variable} = ${value} no es un número real finito.`,
        );
      total += term;
      if (!Number.isFinite(total))
        throw new Error("La suma está fuera del rango numérico.");
    }
    return {
      title: "Sumatoria finita",
      lines: [
        `Σ ${expression}, ${variable} = ${lower}…${upper}`,
        `Resultado = ${total}`,
      ],
      note: "Evaluación numérica término a término; no es una fórmula de serie cerrada.",
    };
  }

  if (op === "system") {
    const equations = expression
      .split(/[\n;]/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (equations.length < 2)
      throw new Error("Escribe al menos dos ecuaciones, una por línea.");
    const assignments = nerdamer.solveEquations([...equations]);
    if (!assignments.length)
      throw new Error(
        "No se encontró una solución compatible para el sistema.",
      );
    const exactSolution = isExactSystemSolution(
      nerdamer,
      equations,
      assignments,
    );
    return {
      title: "Solución del sistema",
      lines: assignments.map(
        ([variable, value]) =>
          `${variable} ${exactSolution ? "= " : ""}${withApproximation(nerdamer, String(value), exactSolution)}`,
      ),
    };
  }

  if (op === "numeric") {
    const lower = Number(bounds.lower);
    const upper = Number(bounds.upper);
    if (
      String(bounds.lower ?? "").trim() === "" ||
      String(bounds.upper ?? "").trim() === "" ||
      !Number.isFinite(lower) ||
      !Number.isFinite(upper) ||
      lower >= upper ||
      !Number.isFinite(upper - lower)
    )
      throw new Error("Introduce límites numéricos válidos con a < b.");
    const residual = equationResidual(expression);
    const { evaluateMath } = await import("./math-engine.js");
    const fn = (value) => {
      const result = evaluateMath(
        residual,
        { [variable]: value },
        bounds.angle || "RAD",
      );
      if (typeof result !== "number" || !Number.isFinite(result))
        throw new Error(
          "La función debe producir valores reales finitos en el intervalo.",
        );
      return result;
    };
    const steps = 512;
    let a = lower;
    let fa = fn(a);
    let bracket = null;
    if (fa === 0) bracket = [a, a, fa, fa];
    for (let i = 1; !bracket && i <= steps; i += 1) {
      const b = lower + ((upper - lower) * i) / steps;
      const fb = fn(b);
      if (fb === 0 || fa * fb < 0) bracket = [a, b, fa, fb];
      a = b;
      fa = fb;
    }
    if (!bracket)
      throw new Error(
        "No se detectó una raíz real en ese intervalo. Prueba otro intervalo que cruce el eje.",
      );
    let [left, right, fLeft] = bracket;
    if (left !== right) {
      let iterations = 0;
      for (; iterations < 100; iterations += 1) {
        const middle = left / 2 + right / 2;
        const fMiddle = fn(middle);
        if (
          fMiddle === 0 ||
          Math.abs(right - left) <= 1e-12 * Math.max(1, Math.abs(middle))
        ) {
          left = middle;
          right = middle;
          break;
        }
        if (fLeft * fMiddle < 0) {
          right = middle;
        } else {
          left = middle;
          fLeft = fMiddle;
        }
      }
    }
    const root = left / 2 + right / 2;
    const residualAtRoot = fn(root);
    if (Math.abs(residualAtRoot) > 1e-8)
      throw new Error(
        "El intervalo no converge a una raíz; evita discontinuidades y prueba otro intervalo.",
      );
    return {
      title: "Solución numérica",
      lines: [`${variable} ≈ ${root}`, `Residuo ≈ ${residualAtRoot}`],
      note: `Bisección en [${lower}, ${upper}]; valores trigonométricos en ${bounds.angle || "RAD"}.`,
    };
  }

  if (op === "derivative" || op === "partial") {
    const integrand = unwrapOuterParentheses(
      expression.replace(/^d\/dx\s*/i, ""),
    );
    return {
      title: op === "partial" ? "Derivada parcial" : "Derivada",
      lines: [nerdamer.diff(integrand, variable).toString()],
      note: `Resultado simbólico respecto a ${variable}.`,
    };
  }

  if (op === "integral" || op === "definite") {
    const integrand = unwrapOuterParentheses(
      expression.replace(/^∫\s*/i, "").replace(/\s*d[a-zA-Z]\w*$/i, ""),
    );
    const antiderivative = nerdamer.integrate(integrand, variable);
    if (op === "integral")
      return {
        title: "Integral indefinida",
        lines: [`${antiderivative.toString()} + C`],
      };
    const lower = Number(bounds.lower);
    const upper = Number(bounds.upper);
    if (!Number.isFinite(lower) || !Number.isFinite(upper))
      throw new Error("Introduce límites numéricos válidos.");
    const value = antiderivative
      .evaluate({ [variable]: upper })
      .subtract(antiderivative.evaluate({ [variable]: lower }));
    return {
      title: "Integral definida",
      lines: [value.toString()],
      note: `Evaluada entre ${lower} y ${upper}.`,
    };
  }

  if (op === "limit") {
    const match = expression.match(
      /^lim\s*\(\s*([a-zA-Z]\w*)\s*(?:→|->)\s*([^)]*)\)\s*(.*)$/i,
    );
    if (!match) throw new Error("Formato esperado: lim(x→0) sin(x)/x");
    return {
      title: "Límite",
      lines: [nerdamer.limit(match[3], match[1], match[2]).toString()],
    };
  }

  if (op === "factor")
    return {
      title: "Factorización",
      lines: [nerdamer.factor(expression).toString()],
    };
  if (op === "expand")
    return {
      title: "Expansión",
      lines: [nerdamer.expand(expression).toString()],
    };

  if (op === "solve" || expression.includes("=")) {
    const solved = nerdamer
      .solve(expression, variable)
      .toString()
      .replace(/^\[|\]$/g, "");
    const solutions = solved.split(",").filter(Boolean);
    if (!solutions.length)
      throw new Error(`No se encontró una solución en ${variable}.`);
    return {
      title: solutions.length > 1 ? "Soluciones" : "Solución",
      lines: solutions.map((root) =>
        isExactSolution(nerdamer, expression, variable, root)
          ? `${variable} = ${withApproximation(nerdamer, root)}`
          : `${variable} ${withApproximation(nerdamer, root, false)}`,
      ),
      note: "Soluciones simbólicas cuando las admite el motor.",
    };
  }

  if (op === "simplify")
    return {
      title: "Expresión simplificada",
      lines: [nerdamer(expression).simplify().toString()],
    };
  return {
    title: "Resultado",
    lines: [nerdamer(expression).evaluate().toString()],
  };
}
