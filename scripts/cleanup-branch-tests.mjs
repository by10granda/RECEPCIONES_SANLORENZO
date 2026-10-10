import nextEnv from "@next/env";
import { google } from "googleapis";

nextEnv.loadEnvConfig(process.cwd());
const auth = new google.auth.JWT({ email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"), scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
const sheets = google.sheets({ version: "v4", auth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID;
const warranties = await sheets.spreadsheets.values.get({ spreadsheetId, range: "GARANTIAS!A2:AC" });
const tests = (warranties.data.values || []).map((row, index) => ({ row, index })).filter(({ row }) => row[4] === "PRUEBA AUTOMATICA" && row[5] === "SUCURSAL" && row[13] === "REGISTRO TEMPORAL DE PRUEBA" && row[17] === "Se elimina al terminar la prueba" && row[12]?.startsWith("TEST-"));
if (tests.length) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetId = (title) => meta.data.sheets.find((sheet) => sheet.properties.title === title).properties.sheetId;
  const codes = new Set(tests.map(({ row }) => row[1]));
  const history = await sheets.spreadsheets.values.get({ spreadsheetId, range: "HISTORIAL_ESTADOS!A2:G" });
  const historyRows = (history.data.values || []).map((row, index) => ({ row, index })).filter(({ row }) => codes.has(row[1]));
  const requests = [];
  for (const [title, rows] of [["GARANTIAS", tests], ["HISTORIAL_ESTADOS", historyRows]]) {
    for (const { index } of rows.sort((a, b) => b.index - a.index)) requests.push({ deleteDimension: { range: { sheetId: sheetId(title), dimension: "ROWS", startIndex: index + 1, endIndex: index + 2 } } });
  }
  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
}
console.log(`Registros temporales de pruebas retirados: ${tests.length}.`);
