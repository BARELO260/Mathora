import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = process.cwd();
const destinations = [
  ["mipmap-mdpi", 48],
  ["mipmap-hdpi", 72],
  ["mipmap-xhdpi", 96],
  ["mipmap-xxhdpi", 144],
  ["mipmap-xxxhdpi", 192],
];
const start = [120, 108, 250];
const end = [82, 68, 216];
const mint = [184, 240, 220];

function distanceToSegment(x, y, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const ratio = Math.max(
    0,
    Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)),
  );
  return Math.hypot(x - (ax + ratio * dx), y - (ay + ratio * dy));
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(name, data) {
  const type = Buffer.from(name);
  const content = Buffer.concat([type, data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(content));
  return Buffer.concat([length, content, checksum]);
}

function encodePng(size, { round = false, foreground = false } = {}) {
  const stride = size * 4 + 1;
  const pixels = Buffer.alloc(stride * size);
  const samples = 4;
  const scale = size / 128;
  for (let py = 0; py < size; py += 1) {
    const row = py * stride;
    pixels[row] = 0;
    for (let px = 0; px < size; px += 1) {
      let red = 0,
        green = 0,
        blue = 0,
        alpha = 0;
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const x = (px + (sx + 0.5) / samples) / scale;
          const y = (py + (sy + 0.5) / samples) / scale;
          const isRound = round ? Math.hypot(x - 64, y - 64) <= 62 : true;
          if (!isRound) continue;
          let color;
          if (foreground) {
            const markX = 64 + (x - 64) * 0.78;
            const markY = 64 + (y - 64) * 0.78;
            const onLine = [
              [34, 38, 94, 38],
              [64, 38, 64, 92],
              [43, 72, 85, 72],
            ].some(
              ([ax, ay, bx, by]) =>
                distanceToSegment(markX, markY, ax, ay, bx, by) <= 4.2,
            );
            const onDot = [
              [38, 91],
              [90, 91],
            ].some(([cx, cy]) => Math.hypot(markX - cx, markY - cy) <= 5.2);
            if (!onLine && !onDot) continue;
            color = onDot ? mint : [255, 255, 255];
          } else {
            const blend = Math.min(1, Math.max(0, (x + y) / 256));
            color = start.map((value, index) =>
              Math.round(value + (end[index] - value) * blend),
            );
            const onLine = [
              [34, 38, 94, 38],
              [64, 38, 64, 92],
              [43, 72, 85, 72],
            ].some(
              ([ax, ay, bx, by]) =>
                distanceToSegment(x, y, ax, ay, bx, by) <= 4.2,
            );
            const onDot = [
              [38, 91],
              [90, 91],
            ].some(([cx, cy]) => Math.hypot(x - cx, y - cy) <= 5.2);
            if (onDot) color = mint;
            else if (onLine) color = [255, 255, 255];
          }
          red += color[0];
          green += color[1];
          blue += color[2];
          alpha += 255;
        }
      }
      const count = samples * samples;
      const at = row + 1 + px * 4;
      pixels[at] = Math.round(red / count);
      pixels[at + 1] = Math.round(green / count);
      pixels[at + 2] = Math.round(blue / count);
      pixels[at + 3] = Math.round(alpha / count);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(pixels, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function encodeSplash(width, height) {
  const stride = width * 4 + 1;
  const pixels = Buffer.alloc(stride * height);
  const samples = 2;
  const scale = Math.min(width, height) / 128;
  for (let py = 0; py < height; py += 1) {
    const row = py * stride;
    pixels[row] = 0;
    for (let px = 0; px < width; px += 1) {
      let red = 0,
        green = 0,
        blue = 0,
        alpha = 0;
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const x = 64 + (px + (sx + 0.5) / samples - width / 2) / scale;
          const y = 64 + (py + (sy + 0.5) / samples - height / 2) / scale;
          let color = [247, 248, 252];
          if (Math.hypot(x - 64, y - 64) <= 39) {
            const blend = Math.min(1, Math.max(0, (x + y) / 256));
            color = start.map((value, index) =>
              Math.round(value + (end[index] - value) * blend),
            );
            const markX = 64 + (x - 64) * 0.78;
            const markY = 64 + (y - 64) * 0.78;
            const onLine = [
              [34, 38, 94, 38],
              [64, 38, 64, 92],
              [43, 72, 85, 72],
            ].some(
              ([ax, ay, bx, by]) =>
                distanceToSegment(markX, markY, ax, ay, bx, by) <= 4.2,
            );
            const onDot = [
              [38, 91],
              [90, 91],
            ].some(([cx, cy]) => Math.hypot(markX - cx, markY - cy) <= 5.2);
            if (onDot) color = mint;
            else if (onLine) color = [255, 255, 255];
          }
          red += color[0];
          green += color[1];
          blue += color[2];
          alpha += 255;
        }
      }
      const count = samples * samples;
      const at = row + 1 + px * 4;
      pixels[at] = Math.round(red / count);
      pixels[at + 1] = Math.round(green / count);
      pixels[at + 2] = Math.round(blue / count);
      pixels[at + 3] = Math.round(alpha / count);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(pixels, { level: 7 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

fs.writeFileSync(path.join(root, "public", "icon-512.png"), encodePng(512));
for (const [folder, size] of destinations) {
  const directory = path.join(
    root,
    "android",
    "app",
    "src",
    "main",
    "res",
    folder,
  );
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "ic_launcher.png"), encodePng(size));
  fs.writeFileSync(
    path.join(directory, "ic_launcher_round.png"),
    encodePng(size, { round: true }),
  );
  fs.writeFileSync(
    path.join(directory, "ic_launcher_foreground.png"),
    encodePng(size, { foreground: true }),
  );
}
const resourceDirectory = path.join(
  root,
  "android",
  "app",
  "src",
  "main",
  "res",
);
for (const folder of fs
  .readdirSync(resourceDirectory)
  .filter((name) => name.startsWith("drawable"))) {
  const splash = path.join(resourceDirectory, folder, "splash.png");
  if (!fs.existsSync(splash)) continue;
  const current = fs.readFileSync(splash);
  fs.writeFileSync(
    splash,
    encodeSplash(current.readUInt32BE(16), current.readUInt32BE(20)),
  );
}
console.log("Generated Google Play and legacy Android launcher icons.");
