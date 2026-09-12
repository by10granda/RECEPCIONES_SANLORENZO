import { google } from "googleapis";
import { HISTORY_HEADERS, type StatusHistory, type Warranty, WARRANTY_HEADERS, type WarrantyStatus } from "./types";
import { nowParts } from "./time";

const GARANTIAS = "GARANTIAS";
const HISTORIAL = "HISTORIAL_ESTADOS";

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variable de entorno faltante: ${name}`);
  return value;
}

function normalizeKey(key: string) {
  return key.replace(/\\n/g, "\n");
}

async function client() {
  const auth = new google.auth.JWT({
    email: env("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: normalizeKey(env("GOOGLE_PRIVATE_KEY")),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });
  return google.sheets({ version: "v4", auth });
}

async function ensureSheet(title: string, headers: readonly string[]) {
  const sheets = await client();
  const spreadsheetId = env("GOOGLE_SHEET_ID");
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = meta.data.sheets?.some((s) => s.properties?.title === title);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title } } }] }
    });
  }
  const firstRow = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${title}!1:1` });
  if (!firstRow.data.values?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${title}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [[...headers]] }
    });
  }
}

export async function ensureWorkbook() {
  await ensureSheet(GARANTIAS, WARRANTY_HEADERS);
  await ensureSheet(HISTORIAL, HISTORY_HEADERS);
}

function warrantyFromRow(row: string[], index: number): Warranty {
  return {
    id: row[0] || "",
    code: row[1] || "",
    registeredDate: row[2] || "",
    registeredTime: row[3] || "",
    customerName: row[4] || "",
    customerLastName: row[5] || "",
    documentType: (row[6] as Warranty["documentType"]) || "Cédula",
    documentNumber: row[7] || "",
    phone: row[8] || "",
    email: row[9] || "",
    saleDate: row[10] || "",
    receptionDate: row[11] || "",
    invoiceNumber: row[12] || "",
    productDescription: row[13] || "",
    productCode: row[14] || "",
    serialNumber: row[15] || "",
    reportedFailure: row[16] || "",
    observations: row[17] || "",
    sellerName: row[18] || "",
    company: row[19] || "VARIEDADES PAS",
    currentStatus: (row[20] as WarrantyStatus) || "PRODUCTO RECIBIDO EN EL ALMACEN",
    lastUpdate: row[21] || "",
    createdBy: row[22] || "",
    modifiedAt: row[23] || "",
    modifiedBy: row[24] || "",
    rowNumber: index + 2
  };
}

function warrantyToRow(w: Warranty) {
  return [
    w.id,
    w.code,
    w.registeredDate,
    w.registeredTime,
    w.customerName,
    w.customerLastName,
    w.documentType,
    w.documentNumber,
    w.phone,
    w.email,
    w.saleDate,
    w.receptionDate,
    w.invoiceNumber,
    w.productDescription,
    w.productCode,
    w.serialNumber,
    w.reportedFailure,
    w.observations,
    w.sellerName,
    w.company,
    w.currentStatus,
    w.lastUpdate,
    w.createdBy,
    w.modifiedAt || "",
    w.modifiedBy || ""
  ];
}

function historyFromRow(row: string[], index: number): StatusHistory {
  return {
    id: row[0] || "",
    warrantyCode: row[1] || "",
    date: row[2] || "",
    time: row[3] || "",
    previousStatus: row[4] || "",
    newStatus: (row[5] as WarrantyStatus) || "PRODUCTO RECIBIDO EN EL ALMACEN",
    responsibleUser: row[6] || "",
    rowNumber: index + 2
  };
}

function historyToRow(h: StatusHistory) {
  return [h.id, h.warrantyCode, h.date, h.time, h.previousStatus, h.newStatus, h.responsibleUser];
}

export async function listWarranties() {
  await ensureWorkbook();
  const sheets = await client();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: env("GOOGLE_SHEET_ID"), range: `${GARANTIAS}!A2:Y` });
  return (res.data.values || []).map((row, index) => warrantyFromRow(row as string[], index)).filter((w) => w.id && w.code);
}

export async function listHistory() {
  await ensureWorkbook();
  const sheets = await client();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: env("GOOGLE_SHEET_ID"), range: `${HISTORIAL}!A2:G` });
  return (res.data.values || []).map((row, index) => historyFromRow(row as string[], index)).filter((h) => h.id && h.warrantyCode);
}

export async function getWarranty(idOrCode: string) {
  const warranties = await listWarranties();
  const warranty = warranties.find((w) => w.id === idOrCode || w.code === idOrCode);
  if (!warranty) return null;
  const history = (await listHistory()).filter((h) => h.warrantyCode === warranty.code);
  return { ...warranty, history };
}

export async function generateWarrantyCode() {
  const { year } = nowParts();
  const warranties = await listWarranties();
  const max = warranties
    .map((w) => w.code.match(new RegExp(`^GAR-${year}-(\\d{6})$`))?.[1])
    .filter(Boolean)
    .map(Number)
    .reduce((a, b) => Math.max(a, b), 0);
  return `GAR-${year}-${String(max + 1).padStart(6, "0")}`;
}

export async function appendWarranty(warranty: Warranty) {
  await ensureWorkbook();
  const sheets = await client();
  await sheets.spreadsheets.values.append({
    spreadsheetId: env("GOOGLE_SHEET_ID"),
    range: `${GARANTIAS}!A:Y`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [warrantyToRow(warranty)] }
  });
}

export async function updateWarranty(warranty: Warranty) {
  if (!warranty.rowNumber) throw new Error("No se encontró la fila de la garantía");
  const sheets = await client();
  await sheets.spreadsheets.values.update({
    spreadsheetId: env("GOOGLE_SHEET_ID"),
    range: `${GARANTIAS}!A${warranty.rowNumber}:Y${warranty.rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [warrantyToRow(warranty)] }
  });
}

export async function appendHistory(history: StatusHistory) {
  await ensureWorkbook();
  const sheets = await client();
  await sheets.spreadsheets.values.append({
    spreadsheetId: env("GOOGLE_SHEET_ID"),
    range: `${HISTORIAL}!A:G`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [historyToRow(history)] }
  });
}

export function isDuplicate(candidate: Pick<Warranty, "invoiceNumber" | "productCode" | "serialNumber">, warranties: Warranty[], ignoreId?: string) {
  return warranties.some(
    (w) =>
      w.id !== ignoreId &&
      w.invoiceNumber.trim().toLowerCase() === candidate.invoiceNumber.trim().toLowerCase() &&
      w.productCode.trim().toLowerCase() === candidate.productCode.trim().toLowerCase() &&
      w.serialNumber.trim().toLowerCase() === candidate.serialNumber.trim().toLowerCase()
  );
}
