import "./style.css";
import { symbolicMath } from "./engine.js";
import { normalizeGraphExpression } from "./graph-engine.js";
import {
  analyzeStatistics,
  calculateGeometry,
  calculatePercentage,
  calculateProbability,
  calculateProportion,
  combinatoric,
  convertIntegerBase,
  convertUnit,
  decimalToFraction,
  determinantMatrix,
  multiplyMatrices,
  parseMatrix,
  solveRightTriangle,
  simplifyFraction,
  vectorAdd,
  vectorAngle,
  vectorCross,
  vectorDot,
  vectorMagnitude,
  vectorSubtract,
  unitCatalog,
} from "./tools-engine.js";
let mathEnginePromise;
const getMathEngine = () => (mathEnginePromise ??= import("./math-engine.js"));

function getStored(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The calculator remains usable when storage is disabled or full.
  }
}

function removeStored(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage may be unavailable in private browsing contexts.
  }
}

function readHistory() {
  try {
    const value = JSON.parse(getStored("mathoraHistory") || "[]");
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (item) =>
          item &&
          typeof item.expr === "string" &&
          typeof item.result === "string" &&
          Number.isFinite(item.time),
      )
      .slice(0, 60);
  } catch {
    removeStored("mathoraHistory");
    return [];
  }
}

function readMemory() {
  const value = Number(getStored("mathoraMemory"));
  return Number.isFinite(value) ? value : 0;
}

const icons = { calc: "▦", graph: "⌁", solve: "ƒ", tools: "◈", history: "↺" };
const scientificKeys = [
  "asin",
  "acos",
  "atan",
  "sinh",
  "cosh",
  "tanh",
  "asinh",
  "acosh",
  "atanh",
  "ln",
  "log10",
  "exp",
  "abs",
  "!",
  "^",
  "gcd",
  "lcm",
  "nCr",
  "nPr",
];
const state = {
  page: "calc",
  expr: "",
  result: "",
  angle: "DEG",
  dark: getStored("theme") === "dark",
  history: readHistory(),
  memory: readMemory(),
  graphFns: ["x"],
  scale: 45,
  offsetX: 0,
  offsetY: 0,
};
const app = document.querySelector("#app");
function render() {
  document.documentElement.dataset.theme = state.dark ? "dark" : "light";
  app.innerHTML = `<header class="topbar"><div class="brand"><span class="brandmark">M</span><span>mathora<span class="brand-dot">.</span></span></div><button class="icon-btn theme" aria-label="Cambiar tema">${state.dark ? "☀" : "☾"}</button></header><main>${state.page === "calc" ? calculator() : state.page === "graph" ? graphPage() : state.page === "solve" ? solvePage() : state.page === "tools" ? toolsPage() : historyPage()}</main><nav class="bottom-nav">${[
    ["calc", "Calcular"],
    ["graph", "Gráficas"],
    ["solve", "Resolver"],
    ["tools", "Herramientas"],
    ["history", "Historial"],
  ]
    .map(
      ([id, label]) =>
        `<button class="nav-item ${state.page === id ? "active" : ""}" data-page="${id}"><span>${icons[id]}</span><small>${label}</small></button>`,
    )
    .join(
      "",
    )}</nav><footer class="app-footer"><a href="./privacy-policy.html">Política de privacidad</a></footer>`;
  bind();
  if (state.page === "graph") void drawGraph();
}
function calculator() {
  return `<section class="greeting"><div><p class="eyebrow">TU ESPACIO MATEMÁTICO</p><h1>Piensa en<br><span>números.</span></h1></div><div class="sparkle">✳</div></section><section class="calc-card"><div class="calc-tools"><button class="pill" id="angle">${state.angle} <span>⌄</span></button><button class="pill" id="copyExpr">⧉ <span>Copiar</span></button><button class="pill" id="clear">AC</button></div><div class="display"><div class="expression" id="expression" contenteditable="true" role="textbox" aria-label="Expresión matemática" spellcheck="false" dir="auto">${escapeHtml(state.expr) || '<span class="placeholder">Escribe una operación</span>'}</div><div class="result" id="result">${escapeHtml(state.result) || "0"}</div></div><details class="scientific-panel"><summary>Funciones científicas y enteras</summary><div class="scientific-keypad">${scientificKeys.map((key) => `<button class="key function" data-key="${key}">${key}</button>`).join("")}</div></details><div class="keypad">${["sin", "cos", "tan", "√", "x²", "7", "8", "9", "÷", "(", "4", "5", "6", "×", ")", "1", "2", "3", "−", "⌫", "%", "0", ".", "+", "="].map((k) => `<button class="key ${"÷×−+".includes(k) ? "operator" : ""} ${k === "=" ? "equals" : ""} ${["sin", "cos", "tan", "√", "x²", "(", ")", "%"].includes(k) ? "function" : ""}" data-key="${k}">${k}</button>`).join("")}</div></section><div class="shortcut-row"><button class="shortcut" id="pi"><span>π</span><small>Pi</small></button><button class="shortcut" id="euler"><span>e</span><small>Euler</small></button><button class="shortcut" id="ans"><span>↗</span><small>Ans</small></button><button class="shortcut" id="memory"><span>◇</span><small>Memoria</small></button></div><section class="tip-card"><span class="tip-icon">✦</span><div><b>Un paso a la vez</b><p>Una buena pregunta ya es la mitad de la solución.</p></div><span class="tip-arrow">↗</span></section>`;
}
function graphPage() {
  return `<section class="page-heading"><p class="eyebrow">VISUALIZA TUS IDEAS</p><h1>Gráficas</h1><p>Traza una o varias funciones y descubre su forma.</p></section><section class="panel graph-panel"><label class="field-label">FUNCIONES <span>Una expresión por línea; usa x</span></label><div class="input-line"><span class="math-y">y =</span><textarea id="graphExpr" rows="2" aria-label="Funciones a graficar">${escapeHtml(state.graphFns.join("\n"))}</textarea><button class="plot-btn" id="plot">Graficar ↗</button></div><canvas id="plotCanvas" aria-label="Gráfica interactiva; los cruces con los ejes X e Y se marcan"></canvas><div id="graphLegend" class="graph-legend"></div><div class="graph-controls"><button id="zoomOut">−</button><span>Desliza para explorar</span><button id="zoomIn">+</button></div><div id="coordinates" class="coordinates">Toca la gráfica para ver coordenadas; los cruces con X llevan un punto.</div></section><div class="examples"><span>PRUEBA</span>${["sin(x)", "x^2", "2*x+5"].map((x) => `<button class="example" data-fn="${x}">${x}</button>`).join("")}</div><p class="helper">También puedes usar cos(x), tan(x), sqrt(x), log(x), ln(x) y más.</p>`;
}
function solvePage() {
  return `<section class="page-heading"><p class="eyebrow">DE LA PREGUNTA AL RESULTADO</p><h1>Resolver</h1><p>Álgebra y cálculo simbólico asistidos por Nerdamer.</p></section><section class="panel solver"><label class="field-label">ESCRIBE TU EXPRESIÓN <span>Ecuaciones, desigualdades, sumas y expresiones</span></label><textarea id="solveInput" placeholder="Ej. x^2 + 3x - 4 = 0">${escapeHtml(state.solveInput || "")}</textarea><div class="solver-actions"><select id="operation"><option value="auto">Detectar operación</option><option value="solve">Resolver ecuación</option><option value="numeric">Raíz numérica en intervalo</option><option value="inequality">Desigualdad polinómica</option><option value="system">Sistema de ecuaciones</option><option value="derivative">Derivada</option><option value="partial">Derivada parcial</option><option value="integral">Integral indefinida</option><option value="definite">Integral definida</option><option value="sum">Sumatoria finita</option><option value="limit">Límite (lim(x→a) f(x))</option><option value="simplify">Simplificar</option><option value="factor">Factorizar</option><option value="expand">Expandir</option></select><button id="solve" class="plot-btn">Resolver ↗</button></div><div id="variableRow" class="variable-row hidden"><label>Variable<input id="solveVariable" value="x" maxlength="16" autocapitalize="off" spellcheck="false"></label></div><div id="bounds" class="bounds hidden"><label>Límite inferior<input id="boundA" type="number" value="0"></label><label>Límite superior<input id="boundB" type="number" value="1"></label></div><div id="solveResult" class="solve-output">${state.solveOutput || '<span class="muted">La solución aparecerá aquí. El alcance depende de lo que soporte el motor matemático.</span>'}</div></section><div class="solver-note"><span>ⓘ</span>Las raíces numéricas usan bisección en un intervalo que cruce la función. Las desigualdades se limitan a polinomios de una variable.</div>`;
}
function toolsPage() {
  return `<section class="page-heading"><p class="eyebrow">PEQUEÑAS GRANDES AYUDAS</p><h1>Herramientas</h1><p>Atajos para los cálculos de cada día.</p></section><div class="tool-grid">
  <article class="tool-card"><span class="tool-symbol">%</span><b>Porcentaje</b><p>Calcula qué porcentaje representa una cantidad.</p><div class="tool-inputs"><input id="pctA" type="number" placeholder="Cantidad"><span>de</span><input id="pctB" type="number" placeholder="Total"></div><button class="tool-action" id="pctGo">Calcular</button><div class="tool-output" id="pctOut"></div></article>
  <article class="tool-card"><span class="tool-symbol fraction">½</span><b>Fracciones y decimales</b><p>Simplifica fracciones, conviértelas o aproxima un decimal.</p><div class="tool-inputs"><input id="fracA" type="number" placeholder="Numerador"><span>/</span><input id="fracB" type="number" placeholder="Denominador"></div><button class="tool-action" id="fracGo">Simplificar / decimal</button><input id="decimalValue" class="wide-input" type="number" step="any" placeholder="Decimal (ej. 0.375)"><button class="tool-action" id="decimalFractionGo">Decimal → fracción</button><div class="tool-output" id="fracOut"></div></article>
  <article class="tool-card"><span class="tool-symbol">↔</span><b>Regla de tres</b><p>Encuentra el valor proporcional que falta.</p><div class="tool-inputs triple"><input id="ruleA" type="number" placeholder="A"><span>→</span><input id="ruleB" type="number" placeholder="B"><span>·</span><input id="ruleC" type="number" placeholder="C"></div><button class="tool-action" id="ruleGo">Calcular D</button><div class="tool-output" id="ruleOut"></div></article>
  <article class="tool-card"><span class="tool-symbol">x̄</span><b>Estadística</b><p>Media, mediana, moda y desviación estándar poblacional.</p><input id="stats" class="wide-input" placeholder="12, 8, 15, 8, 20"><button class="tool-action" id="statsGo">Analizar</button><div class="tool-output" id="statsOut"></div></article>
  <article class="tool-card"><span class="tool-symbol">P(A)</span><b>Probabilidad simple</b><p>Casos equiprobables favorables entre posibles.</p><div class="tool-inputs"><input id="probFavorable" type="number" min="0" placeholder="Favorables"><span>/</span><input id="probTotal" type="number" min="1" placeholder="Posibles"></div><button class="tool-action" id="probGo">Calcular probabilidad</button><div class="tool-output" id="probOut"></div></article>
  <article class="tool-card"><span class="tool-symbol">nCr</span><b>Combinatoria</b><p>Permutaciones y combinaciones exactas.</p><div class="tool-inputs"><input id="combN" type="number" min="0" placeholder="n"><span>elige</span><input id="combR" type="number" min="0" placeholder="r"></div><div class="tool-inputs"><button class="tool-action" id="chooseGo">nCr</button><button class="tool-action" id="permGo">nPr</button></div><div class="tool-output" id="combOut"></div></article>
  <article class="tool-card"><span class="tool-symbol">A·B</span><b>Matrices</b><p>Determinante y producto matricial; hasta 10 × 10.</p><label class="matrix-label" for="matrixA">A · filas separadas por línea</label><textarea id="matrixA" class="matrix-entry" rows="3" aria-label="Matriz A" placeholder="1, 2\n3, 4"></textarea><label class="matrix-label" for="matrixB">B · filas separadas por línea</label><textarea id="matrixB" class="matrix-entry" rows="3" aria-label="Matriz B" placeholder="5, 6\n7, 8"></textarea><div class="tool-inputs"><button class="tool-action" id="detGo">det(A)</button><button class="tool-action" id="matrixMultiplyGo">A × B</button></div><div class="tool-output" id="detOut"></div><div class="tool-output" id="matrixOut"></div></article>
  <article class="tool-card"><span class="tool-symbol">△</span><b>Trigonometría</b><p>Resuelve los lados de un triángulo rectángulo con un ángulo agudo.</p><select id="knownSide"><option value="opposite">Lado opuesto conocido</option><option value="adjacent">Lado adyacente conocido</option><option value="hypotenuse">Hipotenusa conocida</option></select><input id="knownLength" class="wide-input" type="number" min="0" step="any" placeholder="Longitud conocida"><input id="acuteAngle" class="wide-input" type="number" min="0" max="90" step="any" placeholder="Ángulo en grados"><button class="tool-action" id="triangleGo">Calcular lados</button><div class="tool-output" id="triangleOut"></div></article>
  <article class="tool-card"><span class="tool-symbol">· ×</span><b>Vectores</b><p>Suma, resta, productos punto y vectorial, magnitud y ángulo.</p><input id="vectorA" class="wide-input" placeholder="Vector A: 1, 2, 3"><input id="vectorB" class="wide-input" placeholder="Vector B: 4, 5, 6"><div class="tool-inputs"><button class="tool-action" id="vectorAddGo">A + B</button><button class="tool-action" id="vectorSubtractGo">A − B</button></div><div class="tool-inputs"><button class="tool-action" id="dotGo">Producto punto</button><button class="tool-action" id="crossGo">A × B (3D)</button></div><div class="tool-inputs"><button class="tool-action" id="magnitudeGo">|A| magnitud</button><button class="tool-action" id="angleGo">Ángulo (°)</button></div><div class="tool-output" id="dotOut"></div></article>
  <article class="tool-card"><span class="tool-symbol">↔</span><b>Conversión de unidades</b><p>Longitud, masa, tiempo, volumen y temperatura.</p><select id="unitCategory" aria-label="Categoría de conversión">${Object.entries(
    unitCatalog,
  )
    .map(([id, category]) => `<option value="${id}">${category.label}</option>`)
    .join(
      "",
    )}</select><div class="unit-row"><input id="unitValue" type="number" step="any" placeholder="Cantidad"><select id="unitFrom">${Object.entries(
    unitCatalog.length.units,
  )
    .map(([id, unit]) => `<option value="${id}">${unit.label}</option>`)
    .join("")}</select><span>→</span><select id="unitTo">${Object.entries(
    unitCatalog.length.units,
  )
    .map(
      ([id, unit]) =>
        `<option value="${id}" ${id === "km" ? "selected" : ""}>${unit.label}</option>`,
    )
    .join(
      "",
    )}</select></div><button class="tool-action" id="unitGo">Convertir</button><div class="tool-output" id="unitOut"></div></article>
  <article class="tool-card"><span class="tool-symbol">2ⁿ</span><b>Sistemas numéricos</b><p>Convierte enteros entre bases 2 y 36.</p><input id="baseValue" class="wide-input" placeholder="Número"><div class="tool-inputs"><label>De <select id="baseFrom">${Array.from(
    { length: 35 },
    (_, i) => i + 2,
  )
    .map(
      (base) =>
        `<option value="${base}" ${base === 10 ? "selected" : ""}>Base ${base}</option>`,
    )
    .join("")}</select></label><label>A <select id="baseTo">${Array.from(
    { length: 35 },
    (_, i) => i + 2,
  )
    .map(
      (base) =>
        `<option value="${base}" ${base === 2 ? "selected" : ""}>Base ${base}</option>`,
    )
    .join(
      "",
    )}</select></label></div><button class="tool-action" id="baseGo">Convertir</button><div class="tool-output" id="baseOut"></div></article>
  <article class="tool-card"><span class="tool-symbol">△</span><b>Geometría</b><p>Áreas planas, perímetros, áreas superficiales y volúmenes.</p><select id="geometryMeasure" aria-label="Medida geométrica"><option value="area">Área</option><option value="perimeter">Perímetro</option><option value="surface">Área superficial</option><option value="volume">Volumen</option></select><select id="shape" aria-label="Figura geométrica"><option value="circle">Círculo</option><option value="rectangle">Rectángulo</option><option value="triangle">Triángulo</option></select><div class="geometry-dimensions"><input id="shapeA" type="number" step="any" placeholder="Radio"><input id="shapeB" type="number" step="any" placeholder="Ancho" hidden><input id="shapeC" type="number" step="any" placeholder="Altura" hidden></div><button class="tool-action" id="areaGo">Calcular área</button><div class="tool-output" id="areaOut"></div></article>
  </div>`;
}
function historyPage() {
  return `<section class="page-heading"><p class="eyebrow">TUS CÁLCULOS RECIENTES</p><h1>Historial</h1><p>Vuelve a cualquier resultado con un toque.</p></section><section class="history-list">${state.history.length ? state.history.map((h, i) => `<button class="history-item" data-history="${i}"><span><span class="history-expression">${escapeHtml(h.expr)}</span><small>${new Date(h.time).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}</small></span><b>${escapeHtml(h.result)}</b></button>`).join("") : '<div class="empty-state"><span>↺</span><b>Todo empieza con una pregunta</b><p>Tus operaciones aparecerán aquí.</p></div>'}</section>${state.history.length ? '<button class="clear-history" id="clearHistory">Borrar historial</button>' : ""}`;
}
function bind() {
  document.querySelector(".theme").onclick = () => {
    state.dark = !state.dark;
    setStored("theme", state.dark ? "dark" : "light");
    render();
  };
  document.querySelectorAll("[data-page]").forEach(
    (b) =>
      (b.onclick = () => {
        state.page = b.dataset.page;
        render();
      }),
  );
  if (state.page === "calc") bindCalc();
  if (state.page === "graph") bindGraph();
  if (state.page === "solve") bindSolve();
  if (state.page === "tools") {
    bindTools();
    bindAdvancedTools();
  }
  if (state.page === "history") {
    document.querySelectorAll("[data-history]").forEach(
      (b) =>
        (b.onclick = () => {
          const h = state.history[+b.dataset.history];
          state.expr = h.expr;
          state.result = h.result;
          state.page = "calc";
          render();
        }),
    );
    document.querySelector("#clearHistory")?.addEventListener("click", () => {
      state.history = [];
      removeStored("mathoraHistory");
      render();
    });
  }
}
function bindCalc() {
  document
    .querySelectorAll("[data-key]")
    .forEach((b) => (b.onclick = () => press(b.dataset.key)));
  document.querySelector("#expression").addEventListener("input", (e) => {
    state.expr = e.currentTarget.innerText;
    state.result = "";
    const out = document.querySelector("#result");
    if (out) out.textContent = "0";
  });
  document.querySelector("#clear").onclick = () => {
    state.expr = "";
    state.result = "";
    render();
  };
  document.querySelector("#angle").onclick = () => {
    state.angle = state.angle === "DEG" ? "RAD" : "DEG";
    render();
  };
  document.querySelector("#pi").onclick = () => append("π");
  document.querySelector("#euler").onclick = () => append("e");
  document.querySelector("#ans").onclick = () => append(state.result || "0");
  document.querySelector("#memory").onclick = () => {
    if (state.result && Number.isFinite(Number(state.result))) {
      state.memory = Number(state.result);
      setStored("mathoraMemory", String(state.memory));
    } else append(String(state.memory));
    toast(
      state.result && Number.isFinite(Number(state.result))
        ? "Guardado en memoria"
        : "Memoria añadida",
    );
  };
  document.querySelector("#copyExpr").onclick = async () => {
    try {
      await navigator.clipboard.writeText(state.result || state.expr);
      toast("Copiado al portapapeles");
    } catch {
      toast("El portapapeles requiere conexión segura");
    }
  };
}
function append(s) {
  state.expr += s;
  state.result = "";
  syncDisplay();
}
function press(k) {
  if (k === "=") {
    calculate();
    return;
  }
  if (k === "⌫") {
    state.expr = state.expr.slice(0, -1);
    state.result = "";
    syncDisplay();
    return;
  }
  const map = {
    "÷": "/",
    "×": "*",
    "−": "-",
    "√": "sqrt(",
    "x²": "^2",
    sin: "sin(",
    cos: "cos(",
    tan: "tan(",
    asin: "asin(",
    acos: "acos(",
    atan: "atan(",
    sinh: "sinh(",
    cosh: "cosh(",
    tanh: "tanh(",
    asinh: "asinh(",
    acosh: "acosh(",
    atanh: "atanh(",
    ln: "ln(",
    log10: "log10(",
    exp: "exp(",
    abs: "abs(",
    gcd: "gcd(",
    lcm: "lcm(",
    nCr: "combinations(",
    nPr: "permutations(",
    "!": "!",
    "^": "^",
  };
  append(map[k] || k);
}
function syncDisplay() {
  const e = document.querySelector("#expression"),
    r = document.querySelector("#result");
  if (e)
    e.innerHTML =
      escapeHtml(state.expr) ||
      '<span class="placeholder">Escribe una operación</span>';
  if (r) r.textContent = state.result || "0";
}
async function calculate() {
  if (!state.expr) return;
  state.result = "…";
  syncDisplay();
  try {
    const val = await evaluate(state.expr);
    if (typeof val === "number" && !Number.isFinite(val))
      throw Error("El resultado no es un número finito.");
    state.result = formatValue(val);
    state.history.unshift({
      expr: state.expr,
      result: state.result,
      time: Date.now(),
    });
    state.history = state.history.slice(0, 60);
    setStored("mathoraHistory", JSON.stringify(state.history));
    syncDisplay();
  } catch (e) {
    state.result = "Error";
    syncDisplay();
    toast(e.message);
  }
}
async function evaluate(source, vars = {}, angle = state.angle) {
  const { evaluateMath } = await getMathEngine();
  return evaluateMath(source, vars, angle);
}
function format(x) {
  return Number.isInteger(x) ? String(x) : Number(x.toPrecision(10)).toString();
}
function formatValue(x) {
  if (typeof x === "number")
    return Number.isInteger(x)
      ? String(x)
      : Number(x.toPrecision(10)).toString();
  if (x?.isComplex) return x.toString();
  return String(x);
}
function bindGraph() {
  document.querySelector("#plot").onclick = async () => {
    const sourceExpressions = document
      .querySelector("#graphExpr")
      .value.split(/\n+/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (!sourceExpressions.length) {
      toast("Escribe al menos una función.");
      return;
    }
    try {
      const expressions = sourceExpressions.map(normalizeGraphExpression);
      const probes = [0, 1, -1, 2, -2, 10, -10];
      for (const expression of expressions) {
        let hasRealSample = false;
        for (const x of probes) {
          try {
            const value = await evaluate(expression, { x }, "RAD");
            if (typeof value === "number" && Number.isFinite(value)) {
              hasRealSample = true;
              break;
            }
          } catch {
            // Functions can be undefined at individual sample points.
          }
        }
        if (!hasRealSample)
          throw Error(
            `No se encontró un valor real graficable para ${expression}.`,
          );
      }
      state.graphFns = expressions;
      await drawGraph();
    } catch (e) {
      toast(`No se pudo graficar: ${e.message}`);
    }
  };
  document.querySelectorAll("[data-fn]").forEach(
    (b) =>
      (b.onclick = () => {
        state.graphFns = [b.dataset.fn];
        document.querySelector("#graphExpr").value = b.dataset.fn;
        drawGraph();
      }),
  );
  document.querySelector("#zoomIn").onclick = () => {
    state.scale = Math.min(180, state.scale * 1.25);
    drawGraph();
  };
  document.querySelector("#zoomOut").onclick = () => {
    state.scale = Math.max(12, state.scale / 1.25);
    drawGraph();
  };
  const c = document.querySelector("#plotCanvas");
  const pointers = new Map();
  let dragOrigin = null;
  let pinchOrigin = null;
  const showCoordinates = (clientX, clientY) => {
    const rect = c.getBoundingClientRect();
    const x =
      (clientX - rect.left - rect.width / 2 - state.offsetX) / state.scale;
    const y =
      (rect.top + rect.height / 2 + state.offsetY - clientY) / state.scale;
    document.querySelector("#coordinates").textContent =
      `x = ${format(x)}   ·   y = ${format(y)}`;
  };
  c.onpointerdown = (e) => {
    c.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size === 1) {
      dragOrigin = [e.clientX, e.clientY];
      showCoordinates(e.clientX, e.clientY);
    }
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchOrigin = {
        distance: Math.hypot(a[0] - b[0], a[1] - b[1]),
        scale: state.scale,
      };
      dragOrigin = null;
    }
  };
  c.onpointermove = (e) => {
    if (pointers.has(e.pointerId))
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size >= 2 && pinchOrigin) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a[0] - b[0], a[1] - b[1]);
      state.scale = Math.max(
        12,
        Math.min(180, pinchOrigin.scale * (distance / pinchOrigin.distance)),
      );
      void drawGraph();
    } else if (dragOrigin) {
      state.offsetX += e.clientX - dragOrigin[0];
      state.offsetY += e.clientY - dragOrigin[1];
      dragOrigin = [e.clientX, e.clientY];
      drawGraph();
    } else {
      showCoordinates(e.clientX, e.clientY);
    }
  };
  c.onpointerup = c.onpointercancel = (e) => {
    pointers.delete(e.pointerId);
    pinchOrigin = null;
    dragOrigin = pointers.size === 1 ? [...pointers.values()][0] : null;
  };
  c.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const r = c.getBoundingClientRect();
      const x =
        (e.clientX - r.left - r.width / 2 - state.offsetX) / state.scale;
      const y =
        (r.height / 2 + state.offsetY - (e.clientY - r.top)) / state.scale;
      state.scale = Math.max(
        12,
        Math.min(180, state.scale * Math.exp(-e.deltaY * 0.001)),
      );
      state.offsetX = e.clientX - r.left - r.width / 2 - x * state.scale;
      state.offsetY = e.clientY - r.top - r.height / 2 + y * state.scale;
      void drawGraph();
    },
    { passive: false },
  );
}
async function drawGraph() {
  const c = document.querySelector("#plotCanvas");
  if (!c) return;
  let evaluateMath;
  try {
    ({ evaluateMath } = await getMathEngine());
  } catch (e) {
    toast(`No se pudo cargar el motor: ${e.message}`);
    return;
  }
  const dpr = devicePixelRatio || 1,
    r = c.getBoundingClientRect();
  c.width = r.width * dpr;
  c.height = r.height * dpr;
  const ctx = c.getContext("2d");
  ctx.scale(dpr, dpr);
  const w = r.width,
    h = r.height,
    cx = w / 2 + state.offsetX,
    cy = h / 2 + state.offsetY,
    s = state.scale;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue(
    "--grid",
  );
  ctx.lineWidth = 1;
  for (let x = cx % s; x < w; x += s) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = cy % s; y < h; y += s) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue(
    "--axis",
  );
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(w, cy);
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, h);
  ctx.stroke();
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(
    "--muted",
  );
  ctx.font = "11px sans-serif";
  ctx.fillText("x", w - 15, cy - 7);
  ctx.fillText("y", cx + 7, 14);
  const colors = ["#6559ed", "#ee6b8a", "#2caa84", "#f39a39"];
  state.graphFns.forEach((expr, index) => {
    const color = colors[index % colors.length];
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    let previous = null;
    const intercepts = [];
    for (let px = 0; px < w; px += 2) {
      const x = (px - cx) / s;
      try {
        const y = evaluateMath(expr, { x }, "RAD"),
          py = cy - y * s;
        if (
          typeof y !== "number" ||
          !Number.isFinite(py) ||
          Math.abs(py) > h * 4
        ) {
          started = false;
          previous = null;
          continue;
        }
        if (y === 0 && previous?.y !== 0) intercepts.push(px);
        else if (previous && previous.y * y < 0) {
          const fraction = previous.y / (previous.y - y);
          intercepts.push(previous.px + fraction * (px - previous.px));
        }
        if (started) ctx.lineTo(px, py);
        else {
          ctx.moveTo(px, py);
          started = true;
        }
        previous = { px, y };
      } catch {
        started = false;
        previous = null;
      }
    }
    ctx.stroke();
    ctx.fillStyle = color;
    for (const px of intercepts) {
      ctx.beginPath();
      ctx.arc(px, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    try {
      const yIntercept = evaluateMath(expr, { x: 0 }, "RAD");
      const py = cy - yIntercept * s;
      if (
        typeof yIntercept === "number" &&
        Number.isFinite(py) &&
        py >= 0 &&
        py <= h
      ) {
        ctx.beginPath();
        ctx.arc(cx, py, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "9px sans-serif";
        ctx.fillText(`(0, ${format(yIntercept)})`, cx + 6, py - 7);
      }
    } catch {
      // The function may be undefined at x = 0 (for example, 1/x).
    }
  });
  const legend = document.querySelector("#graphLegend");
  if (legend)
    legend.innerHTML = state.graphFns
      .map(
        (expr, index) =>
          `<span><i style="--curve-color:${colors[index % colors.length]}"></i>${escapeHtml(expr)}</span>`,
      )
      .join("");
}
function bindSolve() {
  const operation = document.querySelector("#operation"),
    bounds = document.querySelector("#bounds"),
    variableRow = document.querySelector("#variableRow"),
    button = document.querySelector("#solve");
  operation.onchange = () => {
    bounds.classList.toggle(
      "hidden",
      !["definite", "sum", "numeric"].includes(operation.value),
    );
    variableRow.classList.toggle(
      "hidden",
      ![
        "solve",
        "inequality",
        "derivative",
        "partial",
        "integral",
        "definite",
        "sum",
        "numeric",
      ].includes(operation.value),
    );
  };
  button.onclick = async () => {
    const raw = document.querySelector("#solveInput").value.trim();
    state.solveInput = raw;
    button.disabled = true;
    button.textContent = "Calculando…";
    try {
      const result = await symbolicMath(raw, operation.value, {
        lower: document.querySelector("#boundA").value,
        upper: document.querySelector("#boundB").value,
        variable: document.querySelector("#solveVariable").value,
        angle: state.angle,
      });
      state.solveOutput = `<b>${escapeHtml(result.title)}</b><p>${result.lines.map(escapeHtml).join("<br>")}</p>${result.note ? `<small>${escapeHtml(result.note)}</small>` : ""}`;
      document.querySelector("#solveResult").innerHTML = state.solveOutput;
    } catch (e) {
      state.solveOutput = `<span class="error">${escapeHtml(e.message)}</span>`;
      document.querySelector("#solveResult").innerHTML = state.solveOutput;
    } finally {
      button.disabled = false;
      button.textContent = "Resolver ↗";
    }
  };
}
function bindTools() {
  document.querySelector("#pctGo").onclick = () => {
    const fields = ["#pctA", "#pctB"].map((id) =>
      document.querySelector(id).value.trim(),
    );
    const out = document.querySelector("#pctOut");
    try {
      if (fields.some((value) => !value))
        throw Error("Ingresa dos cantidades válidas.");
      const result = calculatePercentage(...fields.map(Number));
      out.textContent = Number.isFinite(result)
        ? `${format(result)}%`
        : "El resultado está fuera del rango numérico.";
    } catch (error) {
      out.textContent = error.message;
    }
  };
  document.querySelector("#fracGo").onclick = () => {
    const fields = ["#fracA", "#fracB"].map((id) =>
      document.querySelector(id).value.trim(),
    );
    const out = document.querySelector("#fracOut");
    try {
      if (fields.some((value) => !value))
        throw Error("Ingresa un numerador y denominador enteros válidos.");
      const result = simplifyFraction(...fields.map(Number));
      out.textContent = `${result.numerator}/${result.denominator} = ${format(result.decimal)}`;
    } catch (error) {
      out.textContent = error.message;
    }
  };
  document.querySelector("#ruleGo").onclick = () => {
    const fields = ["#ruleA", "#ruleB", "#ruleC"].map((id) =>
      document.querySelector(id).value.trim(),
    );
    const out = document.querySelector("#ruleOut");
    try {
      if (fields.some((value) => !value))
        throw Error("Ingresa tres cantidades válidas.");
      const value = calculateProportion(...fields.map(Number));
      out.textContent = Number.isFinite(value)
        ? `D = ${format(value)}`
        : "El resultado está fuera del rango numérico.";
    } catch (error) {
      out.textContent = error.message;
    }
  };
  document.querySelector("#statsGo").onclick = () => {
    const xs = document
      .querySelector("#stats")
      .value.split(/[;,\s]+/)
      .filter(Boolean)
      .map(Number);
    const out = document.querySelector("#statsOut");
    try {
      const result = analyzeStatistics(xs);
      out.textContent = `Media: ${format(result.mean)} · Mediana: ${format(result.median)} · Moda: ${result.modes.length ? result.modes.join(", ") : "sin moda"} · σ: ${format(result.deviation)}`;
    } catch (error) {
      out.textContent = error.message;
    }
  };
}
function bindAdvancedTools() {
  document.querySelector("#decimalFractionGo").onclick = () => {
    const source = document.querySelector("#decimalValue").value;
    const out = document.querySelector("#fracOut");
    if (!source.trim()) {
      out.textContent = "Escribe un decimal para convertirlo.";
      return;
    }
    try {
      out.textContent = `${source} = ${decimalToFraction(source)}`;
    } catch (error) {
      out.textContent = error.message;
    }
  };
  document.querySelector("#probGo").onclick = () => {
    const favorableText = document.querySelector("#probFavorable").value.trim();
    const totalText = document.querySelector("#probTotal").value.trim();
    const out = document.querySelector("#probOut");
    if (!favorableText || !totalText) {
      out.textContent = "Ingresa los casos favorables y posibles.";
      return;
    }
    try {
      const result = calculateProbability(
        Number(favorableText),
        Number(totalText),
      );
      out.textContent = `P(A) = ${result.numerator}/${result.denominator} = ${format(result.percent)}%`;
    } catch (error) {
      out.textContent = error.message;
    }
  };
  const measure = document.querySelector("#geometryMeasure");
  const shape = document.querySelector("#shape");
  const shapeFields = ["#shapeA", "#shapeB", "#shapeC"].map((selector) =>
    document.querySelector(selector),
  );
  const geometryOptions = {
    area: {
      circle: ["Círculo", ["Radio"]],
      rectangle: ["Rectángulo", ["Largo", "Ancho"]],
      triangle: ["Triángulo", ["Base", "Altura"]],
    },
    perimeter: {
      circle: ["Círculo", ["Radio"]],
      rectangle: ["Rectángulo", ["Largo", "Ancho"]],
      triangle: ["Triángulo", ["Lado a", "Lado b", "Lado c"]],
    },
    volume: {
      sphere: ["Esfera", ["Radio"]],
      cylinder: ["Cilindro", ["Radio", "Altura"]],
      box: ["Prisma rectangular", ["Largo", "Ancho", "Alto"]],
      cone: ["Cono", ["Radio", "Altura"]],
    },
    surface: {
      sphere: ["Esfera", ["Radio"]],
      cylinder: ["Cilindro", ["Radio", "Altura"]],
      box: ["Prisma rectangular", ["Largo", "Ancho", "Alto"]],
      cone: ["Cono", ["Radio", "Altura"]],
    },
  };
  const updateGeometryFields = () => {
    const options = geometryOptions[measure.value];
    const previousShape = shape.value;
    shape.innerHTML = Object.entries(options)
      .map(
        ([id, [label]]) =>
          `<option value="${id}" ${id === previousShape ? "selected" : ""}>${label}</option>`,
      )
      .join("");
    const [shapeName, dimensions] = options[shape.value];
    shapeFields.forEach((field, index) => {
      field.hidden = index >= dimensions.length;
      field.placeholder = dimensions[index] || "";
      field.setAttribute(
        "aria-label",
        dimensions[index] || "Dimensión no utilizada",
      );
    });
    document.querySelector("#areaGo").textContent = `Calcular ${
      measure.value === "area"
        ? "área"
        : measure.value === "perimeter"
          ? "perímetro"
          : measure.value === "surface"
            ? "área superficial"
            : "volumen"
    }`;
    shape.setAttribute("aria-label", shapeName);
  };
  measure.onchange = updateGeometryFields;
  shape.onchange = updateGeometryFields;
  updateGeometryFields();
  document.querySelector("#areaGo").onclick = () => {
    const out = document.querySelector("#areaOut");
    try {
      const dimensions = shapeFields
        .filter((field) => !field.hidden)
        .map((field) => Number(field.value));
      const result = calculateGeometry(measure.value, shape.value, dimensions);
      const unit =
        measure.value === "area" || measure.value === "surface"
          ? "unidades²"
          : measure.value === "volume"
            ? "unidades³"
            : "unidades";
      const label =
        measure.value === "area"
          ? "Área"
          : measure.value === "perimeter"
            ? "Perímetro"
            : measure.value === "surface"
              ? "Área superficial"
              : "Volumen";
      out.textContent = `${label} = ${format(result)} ${unit}`;
    } catch (error) {
      out.textContent = error.message;
    }
  };
  document.querySelector("#baseGo").onclick = () => {
    const source = document.querySelector("#baseValue").value.trim();
    const from = Number(document.querySelector("#baseFrom").value);
    const to = Number(document.querySelector("#baseTo").value);
    const out = document.querySelector("#baseOut");
    try {
      if (!source) throw Error("Escribe un entero para convertir.");
      out.textContent = `${source.toUpperCase()}₍${from}₎ = ${convertIntegerBase(source, from, to)}₍${to}₎`;
    } catch (error) {
      out.textContent = error.message;
    }
  };
  const choose = (permutation) => {
    const n = Number(document.querySelector("#combN").value),
      r = Number(document.querySelector("#combR").value),
      out = document.querySelector("#combOut");
    try {
      const value = combinatoric(n, r, permutation);
      out.textContent = `${permutation ? "nPr" : "nCr"} = ${value.toString()}`;
    } catch (error) {
      out.textContent = error.message;
    }
  };
  document.querySelector("#chooseGo").onclick = () => choose(false);
  document.querySelector("#permGo").onclick = () => choose(true);
  document.querySelector("#detGo").onclick = () => {
    const out = document.querySelector("#detOut");
    try {
      const matrix = parseMatrix(document.querySelector("#matrixA").value);
      const determinant = determinantMatrix(matrix);
      out.textContent = Number.isFinite(determinant)
        ? `det(A) = ${format(determinant)}`
        : "El resultado está fuera del rango numérico.";
    } catch (error) {
      out.textContent = error.message;
    }
  };
  document.querySelector("#matrixMultiplyGo").onclick = () => {
    const out = document.querySelector("#matrixOut");
    try {
      const result = multiplyMatrices(
        parseMatrix(document.querySelector("#matrixA").value),
        parseMatrix(document.querySelector("#matrixB").value),
      );
      out.textContent = `A × B = ${result.map((row) => row.map(format).join("  ")).join("; ")}`;
    } catch (error) {
      out.textContent = error.message;
    }
  };
  document.querySelector("#triangleGo").onclick = () => {
    const out = document.querySelector("#triangleOut");
    try {
      const result = solveRightTriangle(
        document.querySelector("#knownSide").value,
        Number(document.querySelector("#knownLength").value),
        Number(document.querySelector("#acuteAngle").value),
      );
      out.textContent = `Opuesto: ${format(result.opposite)} · Adyacente: ${format(result.adjacent)} · Hipotenusa: ${format(result.hypotenuse)}`;
    } catch (error) {
      out.textContent = error.message;
    }
  };
  const parseVector = (id) =>
    document
      .querySelector(id)
      .value.split(/[;,\s]+/)
      .filter(Boolean)
      .map(Number);
  const vectorOutput = document.querySelector("#dotOut");
  const runVectorPair = (label, operation, formatResult = format) => {
    try {
      const result = operation(
        parseVector("#vectorA"),
        parseVector("#vectorB"),
      );
      vectorOutput.textContent = `${label} = ${formatResult(result)}`;
    } catch (error) {
      vectorOutput.textContent = error.message;
    }
  };
  document.querySelector("#vectorAddGo").onclick = () =>
    runVectorPair(
      "A + B",
      vectorAdd,
      (values) => `[${values.map(format).join(", ")}]`,
    );
  document.querySelector("#vectorSubtractGo").onclick = () =>
    runVectorPair(
      "A − B",
      vectorSubtract,
      (values) => `[${values.map(format).join(", ")}]`,
    );
  document.querySelector("#dotGo").onclick = () =>
    runVectorPair("A · B", vectorDot);
  document.querySelector("#crossGo").onclick = () =>
    runVectorPair(
      "A × B",
      vectorCross,
      (values) => `[${values.map(format).join(", ")}]`,
    );
  document.querySelector("#angleGo").onclick = () =>
    runVectorPair("∠(A, B)", vectorAngle, (value) => `${format(value)}°`);
  document.querySelector("#magnitudeGo").onclick = () => {
    try {
      vectorOutput.textContent = `|A| = ${format(vectorMagnitude(parseVector("#vectorA")))}`;
    } catch (error) {
      vectorOutput.textContent = error.message;
    }
  };
  const unitCategory = document.querySelector("#unitCategory");
  const unitFrom = document.querySelector("#unitFrom");
  const unitTo = document.querySelector("#unitTo");
  const updateUnits = () => {
    const options = Object.entries(unitCatalog[unitCategory.value].units);
    const renderOptions = (selected) =>
      options
        .map(
          ([id, unit]) =>
            `<option value="${id}" ${id === selected ? "selected" : ""}>${unit.label}</option>`,
        )
        .join("");
    unitFrom.innerHTML = renderOptions(options[0][0]);
    unitTo.innerHTML = renderOptions(options[1]?.[0] || options[0][0]);
  };
  unitCategory.onchange = updateUnits;
  document.querySelector("#unitGo").onclick = () => {
    const v = Number(document.querySelector("#unitValue").value),
      category = unitCategory.value,
      from = unitFrom.value,
      to = unitTo.value,
      out = document.querySelector("#unitOut");
    try {
      const converted = convertUnit(v, category, from, to);
      out.textContent = Number.isFinite(converted)
        ? `${format(converted)} ${unitCatalog[category].units[to].label}`
        : "El resultado está fuera del rango numérico.";
    } catch (error) {
      out.textContent = error.message;
    }
  };
}
function toast(s) {
  let t = document.querySelector(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = s;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}
function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
document.addEventListener("keydown", (e) => {
  if (
    state.page !== "calc" ||
    document.activeElement.isContentEditable ||
    document.activeElement.tagName === "INPUT"
  )
    return;
  if (/^[0-9.+\-*/()%^!]$/.test(e.key)) append(e.key);
  else if (e.key === "Enter") {
    e.preventDefault();
    calculate();
  } else if (e.key === "Backspace") press("⌫");
});
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("/sw.js").catch(() => {});
render();
