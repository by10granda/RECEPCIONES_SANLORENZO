import fs from "node:fs";
import path from "node:path";

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error("Uso: npm run config:google -- ruta/al/archivo-service-account.json");
  process.exit(1);
}

const absoluteJsonPath = path.resolve(jsonPath);
const credentials = JSON.parse(fs.readFileSync(absoluteJsonPath, "utf8"));

if (credentials.type !== "service_account" || !credentials.client_email || !credentials.private_key) {
  console.error("El archivo JSON no parece ser una clave válida de Service Account.");
  process.exit(1);
}

const envPath = path.resolve(".env.local");
const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const lines = current.split(/\r?\n/).filter(Boolean);
const values = new Map();

for (const line of lines) {
  const index = line.indexOf("=");
  if (index > 0) values.set(line.slice(0, index), line.slice(index + 1));
}

values.set("GOOGLE_SERVICE_ACCOUNT_EMAIL", credentials.client_email);
values.set("GOOGLE_PRIVATE_KEY", JSON.stringify(credentials.private_key));

const order = [
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD",
  "ADMIN_PASSWORD_HASH",
  "GOOGLE_SHEET_ID",
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
  "SESSION_SECRET"
];

const output = [
  ...order.filter((key) => values.has(key)).map((key) => `${key}=${values.get(key)}`),
  ...[...values.keys()].filter((key) => !order.includes(key)).map((key) => `${key}=${values.get(key)}`)
].join("\n") + "\n";

fs.writeFileSync(envPath, output);
console.log("Google Sheets configurado en .env.local. No se imprimió la clave privada.");
