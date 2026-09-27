import test from "node:test";
import assert from "node:assert/strict";
import { symbolicMath } from "../src/engine.js";
import { evaluateMath } from "../src/math-engine.js";

test("arithmetic, implicit multiplication and scientific functions", () => {
  assert.equal(evaluateMath("25 * 48"), 1200);
  assert.equal(evaluateMath("2x + 5", { x: 6 }), 17);
  assert.equal(evaluateMath("sqrt(144)"), 12);
  assert.equal(evaluateMath("5!"), 120);
  assert.equal(evaluateMath("combinations(5, 2)"), 10);
  assert.ok(Math.abs(evaluateMath("sin(30)") - 0.5) < 1e-12);
  assert.ok(Math.abs(evaluateMath("sin(pi / 2)", {}, "RAD") - 1) < 1e-12);
});

test("percent and complex values have meaningful results", () => {
  assert.equal(evaluateMath("25%"), 0.25);
  assert.ok(Math.abs(evaluateMath("ln(e)") - 1) < 1e-12);
  assert.equal(String(evaluateMath("sqrt(-1)")), "i");
});

test("scientific functions, integer operations and scientific notation", () => {
  assert.ok(Math.abs(evaluateMath("asin(0.5)") - 30) < 1e-10);
  assert.ok(
    Math.abs(evaluateMath("sinh(1)", {}, "RAD") - Math.sinh(1)) < 1e-12,
  );
  assert.equal(evaluateMath("gcd(84, 30)"), 6);
  assert.equal(evaluateMath("lcm(12, 18)"), 36);
  assert.equal(evaluateMath("combinations(8, 3)"), 56);
  assert.equal(evaluateMath("permutations(8, 3)"), 336);
  assert.equal(evaluateMath("1e3"), 1000);
});

test("quadratic, linear and system solvers return symbolic solutions", async () => {
  const quadratic = await symbolicMath("x^2 + 3x - 4 = 0", "auto");
  assert.equal(quadratic.title, "Soluciones");
  assert.deepEqual(quadratic.lines.sort(), ["x = -4", "x = 1"]);
  const linear = await symbolicMath("2x + 4 = 10", "solve");
  assert.deepEqual(linear.lines, ["x = 3"]);
  const irrational = await symbolicMath("x^2 = 2", "solve");
  assert.deepEqual(irrational.lines.sort(), [
    "x ≈ -1.414213562",
    "x ≈ 1.414213562",
  ]);
  const system = await symbolicMath("x + y = 3\nx - y = 1", "system");
  assert.deepEqual(system.lines, ["x = 2", "y = 1"]);
});

test("symbolic differentiation, integration, definite integrals and limits", async () => {
  assert.equal(
    (await symbolicMath("x^3 + 4x", "derivative")).lines[0],
    "3*x^2+4",
  );
  assert.match((await symbolicMath("sin(x)", "integral")).lines[0], /cos\(x\)/);
  assert.deepEqual(
    (await symbolicMath("x^2", "definite", { lower: 0, upper: 3 })).lines,
    ["9"],
  );
  assert.deepEqual((await symbolicMath("lim(x→0) sin(x)/x", "auto")).lines, [
    "1",
  ]);
});

test("partial derivatives, polynomial inequalities and finite sums", async () => {
  assert.equal(
    (await symbolicMath("x^2*y + y^2", "partial", { variable: "y" })).lines[0],
    "2*y+x^2",
  );
  assert.deepEqual((await symbolicMath("x^2 - 4 >= 0", "auto")).lines, [
    "(−∞, -2] ∪ [2, ∞)",
  ]);
  assert.deepEqual(
    (await symbolicMath("k^2", "sum", { variable: "k", lower: 1, upper: 5 }))
      .lines,
    ["Σ k^2, k = 1…5", "Resultado = 55"],
  );
  assert.deepEqual((await symbolicMath("x^2 < 4", "inequality")).lines, [
    "(-2, 2)",
  ]);
  assert.deepEqual((await symbolicMath("x^2 <= 4", "inequality")).lines, [
    "[-2, 2]",
  ]);
  assert.deepEqual((await symbolicMath("x^2 <= 0", "inequality")).lines, [
    "{0}",
  ]);
  assert.deepEqual((await symbolicMath("x^2 >= 0", "inequality")).lines, [
    "(−∞, ∞)",
  ]);
  assert.deepEqual((await symbolicMath("x^2 > 0", "inequality")).lines, [
    "(−∞, 0) ∪ (0, ∞)",
  ]);
});

test("numeric root solving uses bisection and reports missing brackets", async () => {
  const result = await symbolicMath("x^2 = 2", "numeric", {
    lower: 1,
    upper: 2,
  });
  assert.ok(
    Math.abs(Number(result.lines[0].split("≈")[1]) - Math.sqrt(2)) < 1e-9,
  );
  await assert.rejects(
    symbolicMath("x^2 + 1", "numeric", { lower: -1, upper: 1 }),
    /No se detectó una raíz/,
  );
});

test("symbolic factorization and expansion", async () => {
  assert.match((await symbolicMath("x^2 - 1", "factor")).lines[0], /x.*x/);
  assert.match((await symbolicMath("(x + 1)^2", "expand")).lines[0], /x\^2/);
});
