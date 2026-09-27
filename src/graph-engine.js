export function normalizeGraphExpression(source) {
  const raw = String(source).trim();
  const expression = raw.replace(/^y\s*=\s*/i, "").trim();
  if (!expression)
    throw new Error("Escribe una expresión de función después de y =.");
  return expression;
}
