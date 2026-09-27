import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const worker = path.join(dist, "sw.js");

function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(absolute) : [absolute];
  });
}

if (!fs.existsSync(worker)) {
  console.error("Vite no generó dist/sw.js.");
  process.exit(1);
}

const assets = filesIn(dist)
  .filter((file) => file !== worker)
  .map((file) => `/${path.relative(dist, file).split(path.sep).join("/")}`)
  .sort();
const source = fs.readFileSync(worker, "utf8");
if (!source.includes("const PRECACHE = []")) {
  console.error(
    "No se encontró el punto de inserción de precarga del Service Worker.",
  );
  process.exit(1);
}
fs.writeFileSync(
  worker,
  source.replace(
    "const PRECACHE = []",
    `const PRECACHE = ${JSON.stringify(assets)}`,
  ),
);
console.log(
  `Service Worker: ${assets.length} recursos listos para uso offline.`,
);
