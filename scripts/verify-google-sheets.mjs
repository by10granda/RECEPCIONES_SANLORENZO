import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

function loadEnv() {
  const envPath = path.resolve(".env.local");
  if (!fs.existsSync(envPath)) throw new Error("No existe .env.local");
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const key = line.slice(0, index);
    let value = line.slice(index + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value.replace(/\\n/g, "\n");
  }
}

const warrantyHeaders = [
  "ID", "Código de garantía", "Fecha de registro", "Hora de registro", "Nombre cliente", "Apellido cliente", "Tipo documento", "Número documento", "Teléfono", "Correo", "Fecha venta", "Fecha recepción almacén", "Número factura", "Descripción producto", "Código producto", "Número serie", "Falla reportada", "Observaciones", "Nombre vendedor", "Empresa", "Estado actual", "Última actualización", "Usuario creador", "Fecha modificación", "Usuario modificador"
];

const historyHeaders = ["ID", "Código garantía", "Fecha", "Hora", "Estado anterior", "Estado nuevo", "Usuario responsable"];

async function ensureSheet(sheets, spreadsheetId, title, headers) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = meta.data.sheets?.some((sheet) => sheet.properties?.title === title);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ addSheet: { properties: { title } } }] } });
    console.log(`Pestaña creada: ${title}`);
  } else {
    console.log(`Pestaña existente: ${title}`);
  }

  const firstRow = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${title}!1:1` });
  if (!firstRow.data.values?.length) {
    await sheets.spreadsheets.values.update({ spreadsheetId, range: `${title}!A1`, valueInputOption: "RAW", requestBody: { values: [headers] } });
    console.log(`Encabezados creados: ${title}`);
  } else {
    console.log(`Encabezados existentes: ${title}`);
  }
}

async function main() {
  loadEnv();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!spreadsheetId || !email || !key) throw new Error("Faltan GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL o GOOGLE_PRIVATE_KEY en .env.local");

  const auth = new google.auth.JWT({ email, key, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  const sheets = google.sheets({ version: "v4", auth });
  await ensureSheet(sheets, spreadsheetId, "GARANTIAS", warrantyHeaders);
  await ensureSheet(sheets, spreadsheetId, "HISTORIAL_ESTADOS", historyHeaders);
  console.log("Conexión con Google Sheets verificada correctamente.");
}

main().catch((error) => {
  console.error("No se pudo verificar Google Sheets.");
  console.error(error.message);
  process.exit(1);
});
