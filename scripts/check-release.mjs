import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const config = JSON.parse(read("capacitor.config.json"));
const variables = read("android/variables.gradle");
const manifest = read("android/app/src/main/AndroidManifest.xml");
const gradle = read("android/app/build.gradle");
const gradleWrapperConfig = read(
  "android/gradle/wrapper/gradle-wrapper.properties",
);
const styles = read("android/app/src/main/res/values/styles.xml");
const colors = read("android/app/src/main/res/values/colors.xml");
const policy = read("public/privacy-policy.html");
const appStrings = read("android/app/src/main/res/values/strings.xml");
const deviceTest = read(
  "android/app/src/androidTest/java/com/mathora/calculator/MathoraInstrumentedTest.java",
);
const listing = read("PLAY_STORE_LISTING.md");
const appSource = read("src/main.js");

if (config.appId !== "com.mathora.calculator")
  errors.push("El ID configurado para Capacitor cambió inesperadamente.");
if (!variables.match(/targetSdkVersion\s*=\s*36\b/))
  errors.push("Android targetSdkVersion debe permanecer en 36.");
if (!variables.match(/compileSdkVersion\s*=\s*36\b/))
  errors.push("Android compileSdkVersion debe permanecer en 36.");
if (!gradle.match(/applicationId\s+["']com\.mathora\.calculator["']/))
  errors.push("El applicationId nativo no coincide con el ID de Capacitor.");
if (!appStrings.includes(config.appId))
  errors.push("El package name de Android no coincide con Capacitor.");
const wrapperHash = crypto
  .createHash("sha256")
  .update(
    fs.readFileSync(
      path.join(root, "android/gradle/wrapper/gradle-wrapper.jar"),
    ),
  )
  .digest("hex");
if (
  !gradleWrapperConfig.includes(
    "distributionSha256Sum=bd71102213493060956ec229d946beee57158dbd89d0e62b91bca0fa2c5f3531",
  ) ||
  wrapperHash !==
    "7d3a4ac4de1c32b59bc6a4eb8ecb8e612ccd0cf1ae1e99f66902da64df296172"
)
  errors.push("Verifica los checksums oficiales del Gradle Wrapper.");
if (!deviceTest.includes(`assertEquals("${config.appId}"`))
  errors.push(
    "La prueba instrumentada no valida el package name de publicación.",
  );
if (!manifest.includes('android:allowBackup="false"'))
  errors.push("La copia de seguridad debe permanecer deshabilitada.");
if (/uses-permission\b/.test(manifest))
  errors.push("Revisa los permisos Android declarados en el manifiesto.");
for (const name of [...styles.matchAll(/@color\/(\w+)/g)].map(
  (match) => match[1],
)) {
  if (!new RegExp(`<color\\s+name=["']${name}["']`).test(colors))
    errors.push(`Falta el recurso Android @color/${name}.`);
}
if (
  /\[(?:nombre del desarrollador o entidad|correo de contacto)\]/i.test(policy)
)
  errors.push("Completa el responsable y correo en la política de privacidad.");
if (!appSource.includes('href="./privacy-policy.html"'))
  errors.push(
    "Agrega un enlace visible a la política de privacidad dentro de la app.",
  );
const listingTitle = listing.match(/^## Nombre\s+\n\s*([^\n]+)/m)?.[1]?.trim();
const shortDescription = listing
  .match(/^## Descripción breve\s+\n\s*([^\n]+)/m)?.[1]
  ?.trim();
if (!listingTitle || listingTitle.length > 30)
  errors.push("El nombre de la ficha debe tener entre 1 y 30 caracteres.");
if (!shortDescription || shortDescription.length > 80)
  errors.push("La descripción breve debe tener entre 1 y 80 caracteres.");

const iconPath = path.join(root, "public", "icon-512.png");
if (!fs.existsSync(iconPath)) {
  errors.push("Falta public/icon-512.png para la ficha de Google Play.");
} else {
  const icon = fs.readFileSync(iconPath);
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (
    icon.length < 24 ||
    !icon.subarray(0, 8).equals(pngSignature) ||
    icon.readUInt32BE(16) !== 512 ||
    icon.readUInt32BE(20) !== 512
  ) {
    errors.push("El icono de Play debe ser un PNG válido de 512 × 512.");
  }
}

for (const file of [
  "dist/privacy-policy.html",
  "android/app/src/main/assets/public/privacy-policy.html",
]) {
  if (!fs.existsSync(path.join(root, file)))
    errors.push(`No se sincronizó ${file}; ejecuta npm run android:sync.`);
}
const serviceWorkerPath = path.join(root, "dist", "sw.js");
if (
  !fs.existsSync(serviceWorkerPath) ||
  !fs.readFileSync(serviceWorkerPath, "utf8").includes("math-engine-")
)
  errors.push("El motor matemático no está incluido en la caché offline.");

if (errors.length) {
  console.error("Revisión de publicación: hay puntos pendientes.");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Revisión estática de publicación completada correctamente.");
