import nextEnv from "@next/env";
import { google } from "googleapis";

nextEnv.loadEnvConfig(process.cwd());
google.options({ timeout: 30000 });
const spreadsheetId = process.env.GOOGLE_MOTOS_SHEET_ID;
const auth = new google.auth.JWT({ email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"), scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
const sheets = google.sheets({ version: "v4", auth });
const values = await sheets.spreadsheets.values.get({ spreadsheetId, range: "MOTOS!A2:Q" });
const records = (values.data.values || []).map((row, index) => ({ row, index })).filter(({ row }) => row[1]?.startsWith("TEST-MOTOS-") && ["REGISTRO TEMPORAL PRUEBA MOTOS", "DESCRIPCION CORREGIDA PRUEBA"].includes(row[2]));
if (records.length) {
  const metadata = await sheets.spreadsheets.get({ spreadsheetId });
  const ids = new Set(records.map(({ row }) => row[0]));
  const history = await sheets.spreadsheets.values.get({ spreadsheetId, range: "HISTORIAL_MOTOS!A2:H" });
  const movements = (history.data.values || []).map((row, index) => ({ row, index })).filter(({ row }) => ids.has(row[1]));
  const requests = [];
  for (const [title, rows] of [["MOTOS", records], ["HISTORIAL_MOTOS", movements]]) {
    const sheetId = metadata.data.sheets.find((sheet) => sheet.properties.title === title).properties.sheetId;
    for (const { index } of rows.sort((a, b) => b.index - a.index)) requests.push({ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: index + 1, endIndex: index + 2 } } });
  }
  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
}
console.log(`Registros temporales de motos retirados: ${records.length}.`);
