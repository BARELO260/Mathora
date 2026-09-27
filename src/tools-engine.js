export const unitCatalog = Object.freeze({
  length: {
    label: "Longitud",
    units: {
      m: { label: "m", factor: 1 },
      km: { label: "km", factor: 1000 },
      cm: { label: "cm", factor: 0.01 },
      mm: { label: "mm", factor: 0.001 },
      ft: { label: "ft", factor: 0.3048 },
      in: { label: "in", factor: 0.0254 },
    },
  },
  mass: {
    label: "Masa",
    units: {
      kg: { label: "kg", factor: 1 },
      g: { label: "g", factor: 0.001 },
      mg: { label: "mg", factor: 0.000001 },
      lb: { label: "lb", factor: 0.45359237 },
      oz: { label: "oz", factor: 0.028349523125 },
    },
  },
  time: {
    label: "Tiempo",
    units: {
      s: { label: "s", factor: 1 },
      ms: { label: "ms", factor: 0.001 },
      min: { label: "min", factor: 60 },
      h: { label: "h", factor: 3600 },
      day: { label: "d", factor: 86400 },
    },
  },
  volume: {
    label: "Volumen",
    units: {
      L: { label: "L", factor: 1 },
      mL: { label: "mL", factor: 0.001 },
      m3: { label: "m³", factor: 1000 },
      gal: { label: "gal (EE. UU.)", factor: 3.785411784 },
    },
  },
  temperature: {
    label: "Temperatura",
    units: {
      c: { label: "°C" },
      f: { label: "°F" },
      k: { label: "K" },
    },
  },
});

function requireFinite(values, label = "Los valores") {
  if (!values.every(Number.isFinite))
    throw new Error(`${label} deben ser números finitos.`);
}

export function simplifyFraction(numerator, denominator) {
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator))
    throw new Error("El numerador y denominador deben ser enteros válidos.");
  if (denominator === 0) throw new Error("El denominador no puede ser cero.");
  let a = Math.abs(numerator);
  let b = Math.abs(denominator);
  while (b) [a, b] = [b, a % b];
  const divisor = a || 1;
  const sign = denominator < 0 ? -1 : 1;
  return {
    numerator: (numerator / divisor) * sign,
    denominator: Math.abs(denominator) / divisor,
    decimal: numerator / denominator,
  };
}

function bigintGcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}

export function decimalToFraction(source) {
  const match = String(source)
    .trim()
    .match(/^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
  if (!match || (!match[2] && !match[3]))
    throw new Error("Escribe un decimal válido.");
  const fraction = match[3] || "";
  const exponent = Number(match[4] || 0);
  if (Math.abs(exponent) > 100 || fraction.length > 100)
    throw new Error("El decimal tiene demasiadas cifras para convertirlo.");
  let numerator = BigInt(`${match[1]}${match[2] || "0"}${fraction}`);
  const scale = fraction.length - exponent;
  const denominator = scale >= 0 ? 10n ** BigInt(scale) : 1n;
  if (scale < 0) numerator *= 10n ** BigInt(-scale);
  const divisor = bigintGcd(numerator, denominator);
  return `${numerator / divisor}/${denominator / divisor}`;
}

export function parseIntegerBase(source, base) {
  if (!Number.isInteger(base) || base < 2 || base > 36)
    throw new Error("La base debe estar entre 2 y 36.");
  const value = String(source).trim().toUpperCase();
  if (!/^[+-]?[0-9A-Z]+$/.test(value))
    throw new Error("Escribe un entero con dígitos válidos para esa base.");
  const negative = value.startsWith("-");
  const digits = value.replace(/^[+-]/, "");
  if (digits.length > 256) throw new Error("Usa como máximo 256 dígitos.");
  let result = 0n;
  for (const char of digits) {
    const digit = parseInt(char, 36);
    if (digit >= base)
      throw new Error(`El dígito ${char} no existe en base ${base}.`);
    result = result * BigInt(base) + BigInt(digit);
  }
  return negative ? -result : result;
}

export function convertIntegerBase(source, from, to) {
  if (!Number.isInteger(to) || to < 2 || to > 36)
    throw new Error("La base debe estar entre 2 y 36.");
  return parseIntegerBase(source, from).toString(to).toUpperCase();
}

export function calculateProbability(favorable, total) {
  if (
    !Number.isSafeInteger(favorable) ||
    !Number.isSafeInteger(total) ||
    total < 1 ||
    favorable < 0 ||
    favorable > total
  )
    throw new Error("Usa enteros con 0 ≤ favorables ≤ posibles.");
  let a = favorable;
  let b = total;
  while (b) [a, b] = [b, a % b];
  const divisor = a || 1;
  return {
    numerator: favorable / divisor,
    denominator: total / divisor,
    percent: (favorable / total) * 100,
  };
}

export function calculateGeometry(measure, shape, dimensions) {
  const required =
    measure === "area"
      ? shape === "circle"
        ? 1
        : 2
      : measure === "perimeter"
        ? shape === "circle"
          ? 1
          : shape === "triangle"
            ? 3
            : shape === "rectangle"
              ? 2
              : 0
        : measure === "volume" || measure === "surface"
          ? shape === "sphere"
            ? 1
            : shape === "box"
              ? 3
              : shape === "cylinder" || shape === "cone"
                ? 2
                : 0
          : 0;
  if (!required || dimensions.length < required)
    throw new Error("La figura no es compatible con esa medida.");
  const values = dimensions.slice(0, required);
  if (values.some((value) => !Number.isFinite(value) || value <= 0))
    throw new Error("Ingresa dimensiones positivas y válidas.");
  const [a, b, c] = values;
  let result;
  if (measure === "area") {
    if (shape === "circle") result = Math.PI * a ** 2;
    else if (shape === "rectangle") result = a * b;
    else if (shape === "triangle") result = (a * b) / 2;
  } else if (measure === "perimeter") {
    if (shape === "circle") result = 2 * Math.PI * a;
    else if (shape === "rectangle") result = 2 * (a + b);
    else if (shape === "triangle") {
      if (a + b <= c || a + c <= b || b + c <= a)
        throw new Error("Las longitudes no pueden formar un triángulo.");
      result = a + b + c;
    }
  } else if (measure === "volume") {
    if (shape === "sphere") result = (4 / 3) * Math.PI * a ** 3;
    else if (shape === "cylinder") result = Math.PI * a ** 2 * b;
    else if (shape === "box") result = a * b * c;
    else if (shape === "cone") result = (Math.PI * a ** 2 * b) / 3;
  } else if (measure === "surface") {
    if (shape === "sphere") result = 4 * Math.PI * a ** 2;
    else if (shape === "cylinder") result = 2 * Math.PI * a * (a + b);
    else if (shape === "box") result = 2 * (a * b + b * c + a * c);
    else if (shape === "cone") result = Math.PI * a * (a + Math.hypot(a, b));
  }
  if (result === undefined)
    throw new Error("La figura no es compatible con esa medida.");
  if (!Number.isFinite(result))
    throw new Error("El resultado está fuera del rango numérico.");
  return result;
}

export function calculateArea(shape, a, b) {
  return calculateGeometry("area", shape, [a, b]);
}

export function parseMatrix(source) {
  const text = String(source).trim();
  if (!text) throw new Error("Escribe los elementos de la matriz.");
  const rows = text.split(/[\n;]+/).map((row) => {
    const trimmed = row.trim();
    const cells = trimmed.split(/[\s,]+/);
    if (!trimmed || cells.some((cell) => !cell)) return [];
    return cells.map(Number);
  });
  if (
    !rows.length ||
    rows.some(
      (row) => !row.length || row.some((value) => !Number.isFinite(value)),
    )
  )
    throw new Error(
      "Escribe filas con números separados por comas o espacios.",
    );
  if (rows.length > 10 || rows.some((row) => row.length > 10))
    throw new Error("Las matrices admiten hasta 10 filas y 10 columnas.");
  if (rows.some((row) => row.length !== rows[0].length))
    throw new Error(
      "Todas las filas deben tener la misma cantidad de columnas.",
    );
  return rows;
}

export function determinantMatrix(matrix) {
  const size = matrix.length;
  if (!size || matrix.some((row) => row.length !== size))
    throw new Error("El determinante requiere una matriz cuadrada.");
  requireFinite(matrix.flat(), "Los elementos");
  const values = matrix.map((row) => [...row]);
  let determinant = 1;
  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1)
      if (Math.abs(values[row][column]) > Math.abs(values[pivot][column]))
        pivot = row;
    if (values[pivot][column] === 0) return 0;
    if (pivot !== column) {
      [values[pivot], values[column]] = [values[column], values[pivot]];
      determinant *= -1;
    }
    const diagonal = values[column][column];
    determinant *= diagonal;
    for (let row = column + 1; row < size; row += 1) {
      const factor = values[row][column] / diagonal;
      for (let col = column + 1; col < size; col += 1)
        values[row][col] -= factor * values[column][col];
    }
  }
  if (!Number.isFinite(determinant))
    throw new Error("El determinante está fuera del rango numérico.");
  return determinant;
}

export function multiplyMatrices(left, right) {
  if (!left.length || !right.length || left[0].length !== right.length)
    throw new Error("Las columnas de A deben coincidir con las filas de B.");
  requireFinite([...left.flat(), ...right.flat()], "Los elementos");
  const result = left.map((row) =>
    right[0].map((_, column) =>
      row.reduce((sum, value, index) => sum + value * right[index][column], 0),
    ),
  );
  requireFinite(result.flat(), "Los resultados");
  return result;
}

export function solveRightTriangle(knownSide, value, angleDegrees) {
  requireFinite([value, angleDegrees], "Los valores");
  if (value <= 0 || angleDegrees <= 0 || angleDegrees >= 90)
    throw new Error("Usa una longitud positiva y un ángulo entre 0° y 90°.");
  const sine = Math.sin((angleDegrees * Math.PI) / 180);
  const cosine = Math.cos((angleDegrees * Math.PI) / 180);
  const tangent = Math.tan((angleDegrees * Math.PI) / 180);
  let opposite;
  let adjacent;
  let hypotenuse;
  if (knownSide === "opposite") {
    opposite = value;
    hypotenuse = value / sine;
    adjacent = value / tangent;
  } else if (knownSide === "adjacent") {
    adjacent = value;
    hypotenuse = value / cosine;
    opposite = value * tangent;
  } else if (knownSide === "hypotenuse") {
    hypotenuse = value;
    opposite = value * sine;
    adjacent = value * cosine;
  } else throw new Error("Selecciona el lado conocido.");
  requireFinite([opposite, adjacent, hypotenuse], "Los resultados");
  return { opposite, adjacent, hypotenuse };
}

export function vectorDot(a, b) {
  validateVectorPair(a, b);
  const result = a.reduce((sum, value, index) => sum + value * b[index], 0);
  requireFinite([result], "El producto punto");
  return result;
}

function validateVectorPair(a, b) {
  if (!a.length || a.length !== b.length)
    throw new Error("Los vectores deben tener la misma dimensión no vacía.");
  requireFinite([...a, ...b], "Los componentes");
}

export function vectorAdd(a, b) {
  validateVectorPair(a, b);
  const result = a.map((value, index) => value + b[index]);
  requireFinite(result, "La suma");
  return result;
}

export function vectorSubtract(a, b) {
  validateVectorPair(a, b);
  const result = a.map((value, index) => value - b[index]);
  requireFinite(result, "La resta");
  return result;
}

export function vectorCross(a, b) {
  validateVectorPair(a, b);
  if (a.length !== 3)
    throw new Error(
      "El producto vectorial requiere vectores de 3 componentes.",
    );
  const result = [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  requireFinite(result, "El producto vectorial");
  return result;
}

export function vectorAngle(a, b) {
  validateVectorPair(a, b);
  const denominator = vectorMagnitude(a) * vectorMagnitude(b);
  if (denominator === 0)
    throw new Error("El ángulo no está definido para un vector nulo.");
  const cosine = Math.max(-1, Math.min(1, vectorDot(a, b) / denominator));
  return (Math.acos(cosine) * 180) / Math.PI;
}

export function vectorMagnitude(values) {
  if (!values.length) throw new Error("Escribe al menos un componente.");
  requireFinite(values, "Los componentes");
  const result = Math.hypot(...values);
  requireFinite([result], "La magnitud");
  return result;
}

export function analyzeStatistics(values) {
  if (!values.length || values.length > 10000)
    throw new Error("Escribe entre 1 y 10 000 números.");
  requireFinite(values, "Los valores");
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, value) => sum + value / values.length, 0);
  const middle = Math.floor(values.length / 2);
  const median =
    values.length % 2
      ? sorted[middle]
      : sorted[middle - 1] / 2 + sorted[middle] / 2;
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  const maxCount = [...counts.values()].reduce(
    (max, count) => Math.max(max, count),
    0,
  );
  const modes = [...counts]
    .filter(([, count]) => count === maxCount)
    .map(([value]) => value);
  const deviation = Math.sqrt(
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length,
  );
  requireFinite([mean, median, deviation], "Los resultados");
  return { mean, median, modes: maxCount === 1 ? [] : modes, deviation };
}

export function convertUnit(value, category, from, to) {
  if (!Number.isFinite(value)) throw new Error("Ingresa una cantidad válida.");
  const units = unitCatalog[category]?.units;
  if (!units?.[from] || !units?.[to])
    throw new Error("Selecciona unidades compatibles de la misma categoría.");
  if (["mass", "volume"].includes(category) && value < 0)
    throw new Error("La masa y el volumen no pueden ser negativos.");
  let result;
  if (category === "temperature") {
    const celsius =
      from === "c"
        ? value
        : from === "f"
          ? ((value - 32) * 5) / 9
          : value - 273.15;
    if (celsius < -273.15 - 1e-10)
      throw new Error("La temperatura no puede estar bajo el cero absoluto.");
    result =
      to === "c"
        ? celsius
        : to === "f"
          ? (celsius * 9) / 5 + 32
          : celsius + 273.15;
  } else {
    result = (value * units[from].factor) / units[to].factor;
  }
  requireFinite([result], "El resultado");
  return result;
}

export function convertLength(value, from, to) {
  return convertUnit(value, "length", from, to);
}

export function calculatePercentage(part, total) {
  if (!Number.isFinite(part) || !Number.isFinite(total))
    throw new Error("Ingresa dos cantidades válidas.");
  if (total === 0) throw new Error("El total debe ser distinto de cero.");
  return (part / total) * 100;
}

export function calculateProportion(a, b, c) {
  requireFinite([a, b, c], "Las cantidades");
  if (a === 0) throw new Error("A debe ser distinto de cero.");
  return (b * c) / a;
}

export function combinatoric(n, r, permutation = false) {
  if (
    !Number.isInteger(n) ||
    !Number.isInteger(r) ||
    n < 0 ||
    r < 0 ||
    r > n ||
    n > 10000
  )
    throw new Error("Usa enteros con 0 ≤ r ≤ n ≤ 10 000.");
  let result = 1n;
  for (let i = 0; i < r; i += 1) result *= BigInt(n - i);
  if (!permutation) for (let i = 2; i <= r; i += 1) result /= BigInt(i);
  return result;
}
