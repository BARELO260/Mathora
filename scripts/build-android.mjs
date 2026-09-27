import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const android = path.join(root, "android");
const windows = process.platform === "win32";
const wrapper = path.join(android, windows ? "gradlew.bat" : "gradlew");
const localJdkRoot = path.join(root, ".android-toolchain", "jdk");
const bundledJavaHomes = fs.existsSync(localJdkRoot)
  ? fs
      .readdirSync(localJdkRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(localJdkRoot, entry.name))
      .filter((candidate) =>
        fs.existsSync(
          path.join(candidate, "bin", windows ? "java.exe" : "java"),
        ),
      )
      .sort()
  : [];
const javaHome = process.env.JAVA_HOME || bundledJavaHomes.at(-1);
const localSdk = path.join(root, ".android-toolchain", "sdk");
const sdk =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  (fs.existsSync(localSdk) ? localSdk : undefined);
const java =
  javaHome && path.join(javaHome, "bin", windows ? "java.exe" : "java");
const jarsigner =
  javaHome &&
  path.join(javaHome, "bin", windows ? "jarsigner.exe" : "jarsigner");

if (!fs.existsSync(wrapper)) {
  console.error(
    "Falta el Gradle Wrapper en android/. Ejecuta npm run android:sync.",
  );
  process.exit(1);
}
if (!java || !fs.existsSync(java)) {
  console.error(
    "Instala JDK 21 y configura JAVA_HOME antes de compilar el AAB de Android.",
  );
  process.exit(1);
}
const javaVersion = spawnSync(java, ["-version"], {
  encoding: "utf8",
  windowsHide: true,
});
const javaOutput = `${javaVersion.stdout || ""}\n${javaVersion.stderr || ""}`;
const javaMajor = javaOutput.match(/(?:version\s+"|openjdk\s+)(\d+)/i)?.[1];
if (javaVersion.status !== 0 || !javaMajor || Number(javaMajor) < 21) {
  console.error(
    "Se requiere JDK 21 o posterior para compilar Mathora en Android.",
  );
  process.exit(1);
}
if (!sdk || !fs.existsSync(sdk)) {
  console.error(
    "Instala Android SDK Platform 36 y configura ANDROID_HOME antes de compilar.",
  );
  process.exit(1);
}
if (!fs.existsSync(path.join(sdk, "platforms", "android-36", "android.jar"))) {
  console.error(
    "No se encontró Android SDK Platform 36. Instálalo desde SDK Manager.",
  );
  process.exit(1);
}
const tasks = process.argv.slice(2);
if (!tasks.length) tasks.push("bundleRelease");
const isPlayBundle = tasks.some((task) => task.includes("bundleRelease"));
if (isPlayBundle) {
  const required = [
    "MATHORA_UPLOAD_STORE_FILE",
    "MATHORA_UPLOAD_STORE_PASSWORD",
    "MATHORA_UPLOAD_KEY_ALIAS",
    "MATHORA_UPLOAD_KEY_PASSWORD",
  ];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    console.error(
      "AAB sin firmar: firma el bundle en Android Studio o configura todas las variables MATHORA_UPLOAD_* para Gradle.",
    );
    process.exit(1);
  }
  const keystorePath = path.resolve(
    android,
    "app",
    process.env.MATHORA_UPLOAD_STORE_FILE,
  );
  if (!fs.existsSync(keystorePath)) {
    console.error(
      "No se encontró el archivo indicado por MATHORA_UPLOAD_STORE_FILE.",
    );
    process.exit(1);
  }
}

const result = spawnSync(wrapper, tasks, {
  cwd: android,
  stdio: "inherit",
  shell: windows,
  env: {
    ...process.env,
    JAVA_HOME: javaHome,
    ANDROID_HOME: sdk,
    ANDROID_SDK_ROOT: sdk,
  },
});
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status ?? 1);

if (isPlayBundle) {
  const bundle = path.join(
    android,
    "app",
    "build",
    "outputs",
    "bundle",
    "release",
    "app-release.aab",
  );
  if (!fs.existsSync(bundle) || fs.statSync(bundle).size === 0) {
    console.error("Gradle terminó sin generar app-release.aab.");
    process.exit(1);
  }
  const signature = spawnSync(jarsigner, ["-verify", bundle], {
    stdio: "inherit",
    windowsHide: true,
  });
  if (signature.error) {
    console.error(signature.error.message);
    process.exit(1);
  }
  if (signature.status !== 0) {
    console.error("La verificación de firma del AAB falló.");
    process.exit(signature.status ?? 1);
  }
  console.log(`AAB firmado y verificado: ${bundle}`);
}

if (tasks.some((task) => task.includes("assembleRelease"))) {
  const outputs = [
    path.join(
      android,
      "app",
      "build",
      "outputs",
      "apk",
      "release",
      "app-release.apk",
    ),
    path.join(
      android,
      "app",
      "build",
      "outputs",
      "apk",
      "release",
      "app-release-unsigned.apk",
    ),
  ];
  const apk = outputs.find(
    (file) => fs.existsSync(file) && fs.statSync(file).size,
  );
  if (!apk) {
    console.error("Gradle terminó sin generar el APK de validación release.");
    process.exit(1);
  }
  console.log(`APK release creado para pruebas: ${apk}`);
}
