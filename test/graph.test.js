import test from "node:test";
import assert from "node:assert/strict";
import { normalizeGraphExpression } from "../src/graph-engine.js";

test("graph parser accepts explicit y assignments and bare function expressions", () => {
  assert.equal(normalizeGraphExpression("y = x²"), "x²");
  assert.equal(normalizeGraphExpression("Y= sin(x)"), "sin(x)");
  assert.equal(normalizeGraphExpression("2*x + 5"), "2*x + 5");
  assert.throws(() => normalizeGraphExpression(" y = "), /después de y/);
});
