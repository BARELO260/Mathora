import { evaluate } from "mathjs";

export function evaluateMath(source, variables = {}, angle = "DEG") {
  const input = String(source)
    .replaceAll("π", "pi")
    .replaceAll("√", "sqrt")
    .replaceAll("÷", "/")
    .replaceAll("×", "*")
    .replaceAll("−", "-")
    .replaceAll("²", "^2")
    .replaceAll("³", "^3")
    .replace(/\bln(?=\s*\()/gi, "log")
    .replace(/(\d+(?:\.\d+)?|\([^()]*\))\s*%(?=$|[+\-*/),])/g, "($1/100)");
  const radians = angle === "DEG" ? Math.PI / 180 : 1;
  const scope = {
    ...variables,
    sin: (x) => Math.sin(x * radians),
    cos: (x) => Math.cos(x * radians),
    tan: (x) => Math.tan(x * radians),
    asin: (x) => Math.asin(x) / radians,
    acos: (x) => Math.acos(x) / radians,
    atan: (x) => Math.atan(x) / radians,
  };
  return evaluate(input, scope);
}
