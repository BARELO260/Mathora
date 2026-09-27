import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeStatistics,
  calculateArea,
  calculateGeometry,
  calculatePercentage,
  calculateProbability,
  calculateProportion,
  combinatoric,
  convertIntegerBase,
  convertLength,
  convertUnit,
  decimalToFraction,
  determinantMatrix,
  multiplyMatrices,
  parseMatrix,
  vectorAdd,
  vectorAngle,
  vectorCross,
  simplifyFraction,
  vectorDot,
  vectorMagnitude,
  vectorSubtract,
  solveRightTriangle,
} from "../src/tools-engine.js";

test("fraction conversion reduces signs and exact decimal notation", () => {
  assert.deepEqual(simplifyFraction(6, -8), {
    numerator: -3,
    denominator: 4,
    decimal: -0.75,
  });
  assert.deepEqual(simplifyFraction(0, 8), {
    numerator: 0,
    denominator: 1,
    decimal: 0,
  });
  assert.equal(decimalToFraction("0.375"), "3/8");
  assert.equal(decimalToFraction("-2.5e2"), "-250/1");
  assert.equal(decimalToFraction("1e-3"), "1/1000");
  assert.throws(() => simplifyFraction(1, 0), /denominador/);
  assert.throws(() => decimalToFraction("not a number"), /decimal válido/);
});

test("integer base conversion validates digits and supports signed values", () => {
  assert.equal(convertIntegerBase("FF", 16, 2), "11111111");
  assert.equal(convertIntegerBase("-101", 2, 10), "-5");
  assert.equal(convertIntegerBase("z", 36, 10), "35");
  assert.throws(() => convertIntegerBase("102", 2, 10), /no existe/);
  assert.throws(() => convertIntegerBase("1", 10, 1), /base debe/);
});

test("probability, percentage and proportion guard invalid inputs", () => {
  assert.deepEqual(calculateProbability(3, 12), {
    numerator: 1,
    denominator: 4,
    percent: 25,
  });
  assert.throws(() => calculateProbability(5, 4), /favorables/);
  assert.equal(calculatePercentage(25, 200), 12.5);
  assert.throws(() => calculatePercentage(1, 0), /distinto de cero/);
  assert.equal(calculateProportion(2, 4, 8), 16);
  assert.throws(() => calculateProportion(0, 1, 1), /distinto de cero/);
});

test("geometry, matrices, vectors, statistics and unit conversions", () => {
  assert.equal(calculateArea("triangle", 10, 4), 20);
  assert.equal(calculateArea("rectangle", 3, 5), 15);
  assert.ok(Math.abs(calculateArea("circle", 2) - 4 * Math.PI) < 1e-12);
  assert.equal(calculateGeometry("perimeter", "triangle", [3, 4, 5]), 12);
  assert.equal(calculateGeometry("perimeter", "rectangle", [3, 5]), 16);
  assert.ok(
    Math.abs(calculateGeometry("volume", "sphere", [3]) - 36 * Math.PI) < 1e-12,
  );
  assert.ok(
    Math.abs(calculateGeometry("volume", "cylinder", [2, 3]) - 12 * Math.PI) <
      1e-12,
  );
  assert.equal(calculateGeometry("volume", "box", [2, 3, 4]), 24);
  assert.ok(
    Math.abs(calculateGeometry("volume", "cone", [3, 4]) - 12 * Math.PI) <
      1e-12,
  );
  assert.ok(
    Math.abs(calculateGeometry("surface", "sphere", [3]) - 36 * Math.PI) <
      1e-12,
  );
  assert.ok(
    Math.abs(calculateGeometry("surface", "cylinder", [2, 3]) - 20 * Math.PI) <
      1e-12,
  );
  assert.equal(calculateGeometry("surface", "box", [2, 3, 4]), 52);
  assert.ok(
    Math.abs(calculateGeometry("surface", "cone", [3, 4]) - 24 * Math.PI) <
      1e-12,
  );
  assert.throws(() => calculateArea("circle", -1), /positivas/);
  assert.throws(
    () => calculateGeometry("perimeter", "triangle", [1, 2, 4]),
    /formar un triángulo/,
  );
  assert.equal(
    determinantMatrix([
      [1, 2],
      [3, 4],
    ]),
    -2,
  );
  assert.deepEqual(
    multiplyMatrices(
      [
        [1, 2],
        [3, 4],
      ],
      [
        [5, 6],
        [7, 8],
      ],
    ),
    [
      [19, 22],
      [43, 50],
    ],
  );
  assert.equal(vectorDot([1, 2, 3], [4, 5, 6]), 32);
  assert.equal(vectorMagnitude([3, 4]), 5);
  assert.deepEqual(vectorAdd([1, 2], [3, 4]), [4, 6]);
  assert.deepEqual(vectorSubtract([1, 2], [3, 4]), [-2, -2]);
  assert.deepEqual(vectorCross([1, 0, 0], [0, 1, 0]), [0, 0, 1]);
  assert.ok(Math.abs(vectorAngle([1, 0], [0, 1]) - 90) < 1e-12);
  assert.throws(() => vectorCross([1, 2], [3, 4]), /3 componentes/);
  assert.throws(() => vectorAngle([0, 0], [1, 0]), /vector nulo/);
  const stats = analyzeStatistics([2, 3, 3]);
  assert.equal(stats.mean, 8 / 3);
  assert.equal(stats.median, 3);
  assert.deepEqual(stats.modes, [3]);
  assert.ok(Math.abs(stats.deviation - Math.sqrt(2 / 9)) < 1e-12);
  assert.equal(convertLength(1, "km", "m"), 1000);
  assert.ok(
    Math.abs(convertUnit(1, "mass", "kg", "lb") - 2.20462262185) < 1e-10,
  );
  assert.equal(convertUnit(2, "time", "h", "min"), 120);
  assert.equal(convertUnit(1, "volume", "m3", "L"), 1000);
  assert.equal(convertUnit(0, "temperature", "c", "f"), 32);
  assert.equal(convertUnit(32, "temperature", "f", "c"), 0);
  assert.ok(Math.abs(convertUnit(0, "temperature", "c", "k") - 273.15) < 1e-12);
  assert.throws(
    () => convertUnit(-1, "mass", "kg", "g"),
    /no pueden ser negativos/,
  );
  assert.throws(
    () => convertUnit(-300, "temperature", "c", "k"),
    /cero absoluto/,
  );
  assert.throws(
    () => convertUnit(1, "length", "m", "kg"),
    /unidades compatibles/,
  );
});

test("exact combinatorics enforce valid ranges", () => {
  assert.equal(combinatoric(8, 3).toString(), "56");
  assert.equal(combinatoric(8, 3, true).toString(), "336");
  assert.throws(() => combinatoric(3, 4), /0 ≤ r/);
});

test("matrix tools parse general dimensions and validate matrix operations", () => {
  assert.deepEqual(parseMatrix("1, 2\n3, 4"), [
    [1, 2],
    [3, 4],
  ]);
  assert.equal(
    determinantMatrix([
      [0, 1],
      [2, 3],
    ]),
    -2,
  );
  assert.ok(
    Math.abs(
      determinantMatrix([
        [1, 2, 3],
        [0, 1, 4],
        [5, 6, 0],
      ]) - 1,
    ) < 1e-12,
  );
  assert.deepEqual(
    multiplyMatrices(
      [
        [1, 2, 3],
        [4, 5, 6],
      ],
      [[7], [8], [9]],
    ),
    [[50], [122]],
  );
  assert.throws(() => parseMatrix("1, 2\n3"), /misma cantidad/);
  assert.throws(() => parseMatrix("1, 2,"), /filas con números/);
  assert.throws(() => parseMatrix(""), /elementos/);
  assert.throws(
    () =>
      determinantMatrix([
        [1, 2, 3],
        [4, 5, 6],
      ]),
    /cuadrada/,
  );
  assert.throws(() => multiplyMatrices([[1, 2]], [[1, 2]]), /columnas/);
});

test("right-triangle calculator derives sides from a known side and angle", () => {
  const sides = solveRightTriangle("opposite", 3, 30);
  assert.ok(Math.abs(sides.hypotenuse - 6) < 1e-12);
  assert.ok(Math.abs(sides.adjacent - 3 * Math.sqrt(3)) < 1e-12);
  const fromHypotenuse = solveRightTriangle("hypotenuse", 10, 30);
  assert.ok(Math.abs(fromHypotenuse.opposite - 5) < 1e-12);
  assert.ok(Math.abs(fromHypotenuse.adjacent - 5 * Math.sqrt(3)) < 1e-12);
  assert.throws(() => solveRightTriangle("adjacent", 0, 45), /positiva/);
});
