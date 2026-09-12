import fs from "node:fs";
import { spawnSync } from "node:child_process";

const targets = ["production", "preview", "development"];
const keys = [
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD",
  "SESSION_SECRET",
  "GOOGLE_SHEET_ID",
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_PRIVATE_KEY"
];

function parseEnv(text) {
  const values = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const key = line.slice(0, index);
    let value = line.slice(index + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values.set(key, value.replace(/\\n/g, "\n"));
  }
  return values;
}

const env = parseEnv(fs.readFileSync(".env.local", "utf8"));

for (const key of keys) {
  if (!env.get(key)) throw new Error(`Falta ${key} en .env.local`);
}

for (const key of keys) {
  for (const target of targets) {
    spawnSync("npx", ["vercel", "env", "rm", key, target, "--yes"], { stdio: "ignore", shell: true });
    const add = spawnSync("npx", ["vercel", "env", "add", key, target], {
      input: env.get(key),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      shell: true
    });
    if (add.status !== 0) {
      console.error(`No se pudo agregar ${key} en ${target}.`);
      console.error(add.stderr || add.stdout);
      process.exit(add.status || 1);
    }
    console.log(`${key} configurada en ${target}`);
  }
}

console.log("Variables configuradas en Vercel.");
