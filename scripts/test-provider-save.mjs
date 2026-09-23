import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

function loadEnv() {
  const text = fs.readFileSync(path.resolve(".env.local"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const key = line.slice(0, index);
    let value = line.slice(index + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[key] = value.replace(/\\n/g, "\n");
  }
}

async function main() {
  loadEnv();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
  const sheets = google.sheets({ version: "v4", auth });
  const code = `TEST-PROVEEDOR-${Date.now()}`;
  const providerName = "Proveedor Prueba PAS";
  const providerPhone = "0999999999";
  const row = [
    crypto.randomUUID(), code, "23/09/2026", "12:00", "Prueba", "Proveedor", "Cédula", "0000000000", "0990000000", "", "23/09/2026", "23/09/2026", `FAC-${Date.now()}`, "Producto de prueba", "TEST-COD", "TEST-SERIE", "Prueba automática", "Registro temporal", "Sistema", "VARIEDADES PAS", "PRODUCTO RECIBIDO EN EL ALMACEN", "23/09/2026 - 12:00", "test", "", "", "Marca Prueba", providerName, providerPhone
  ];

  await sheets.spreadsheets.values.append({ spreadsheetId, range: "GARANTIAS!A:AB", valueInputOption: "RAW", insertDataOption: "INSERT_ROWS", requestBody: { values: [row] } });
  const values = await sheets.spreadsheets.values.get({ spreadsheetId, range: "GARANTIAS!A2:AB" });
  const rows = values.data.values || [];
  const index = rows.findIndex((candidate) => candidate[1] === code);
  if (index < 0) throw new Error("No se encontró el registro de prueba después de guardarlo.");
  const saved = rows[index];
  if (saved[26] !== providerName || saved[27] !== providerPhone) throw new Error("Proveedor o teléfono proveedor no se guardaron correctamente.");

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetId = meta.data.sheets?.find((sheet) => sheet.properties?.title === "GARANTIAS")?.properties?.sheetId;
  if (sheetId === undefined || sheetId === null) throw new Error("No se encontró la hoja GARANTIAS para limpiar la prueba.");
  const rowNumber = index + 2;
  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: rowNumber - 1, endIndex: rowNumber } } }] } });
  console.log("Prueba correcta: proveedor y teléfono proveedor se guardaron en Google Sheets. Registro temporal eliminado.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
