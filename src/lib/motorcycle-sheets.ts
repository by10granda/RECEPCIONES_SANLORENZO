import { google, type sheets_v4 } from "googleapis";
import { isBranch, type Branch } from "./branches";
import { MOTORCYCLE_HEADERS, MOTORCYCLE_HISTORY_HEADERS, MOTORCYCLE_STATUSES, type Motorcycle, type MotorcycleHistory } from "./motorcycles";

const MAIN = "MOTOS";
const HISTORY = "HISTORIAL_MOTOS";
let initializedUntil = 0;
let initialization: Promise<void> | undefined;

function spreadsheetId() {
  const id = process.env.GOOGLE_MOTOS_SHEET_ID;
  if (!id) throw new Error("Configure GOOGLE_MOTOS_SHEET_ID para usar el módulo de motos.");
  if (id === process.env.GOOGLE_SHEET_ID) throw new Error("La hoja de motos debe ser diferente de la hoja de garantías.");
  return id;
}

function client() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) throw new Error("Faltan credenciales de Google.");
  const auth = new google.auth.JWT({ email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"), scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  return google.sheets({ version: "v4", auth });
}

export async function ensureMotorcycleWorkbook() {
  if (Date.now() < initializedUntil) return;
  if (!initialization) initialization = (async () => {
    const sheets = client();
    const id = spreadsheetId();
    const metadata = await sheets.spreadsheets.get({ spreadsheetId: id });
    for (const [title, headers] of [[MAIN, MOTORCYCLE_HEADERS], [HISTORY, MOTORCYCLE_HISTORY_HEADERS]] as const) {
      let properties = metadata.data.sheets?.find((sheet) => sheet.properties?.title === title)?.properties;
      if (!properties) {
        const added = await sheets.spreadsheets.batchUpdate({ spreadsheetId: id, requestBody: { requests: [{ addSheet: { properties: { title, gridProperties: { columnCount: headers.length } } } }] } });
        properties = added.data.replies?.[0].addSheet?.properties;
      }
      const firstRow = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `${title}!1:1` });
      const actual = firstRow.data.values?.[0] || [];
      if (actual.length && headers.some((header, index) => actual[index] !== header)) throw new Error(`Los encabezados de ${title} no coinciden con el módulo. No se modificaron los datos existentes.`);
      if (!actual.length) {
        if ((properties?.gridProperties?.columnCount || 0) < headers.length) await sheets.spreadsheets.batchUpdate({ spreadsheetId: id, requestBody: { requests: [{ updateSheetProperties: { properties: { sheetId: properties?.sheetId, gridProperties: { columnCount: headers.length } }, fields: "gridProperties.columnCount" } }] } });
        await sheets.spreadsheets.values.update({ spreadsheetId: id, range: `${title}!A1`, valueInputOption: "RAW", requestBody: { values: [[...headers]] } });
      }
    }
    initializedUntil = Date.now() + 300_000;
  })().finally(() => { initialization = undefined; });
  await initialization;
}

export async function listMotorcycles(branch: Branch) {
  await ensureMotorcycleWorkbook();
  const response = await client().spreadsheets.values.get({ spreadsheetId: spreadsheetId(), range: `${MAIN}!A2:Q` });
  return (response.data.values || []).map((row, index): Motorcycle | null => {
    if (!row[0] || !isBranch(row[11]) || !MOTORCYCLE_STATUSES.includes(row[10])) return null;
    return { id: row[0], code: row[1] || "", description: row[2] || "", brand: row[3] || "", chassisNumber: row[4] || "", observations: row[5] || "", receivedAt: row[6] || "", invoiceNumber: row[7] || "", idPdfUrl: row[8] || "", licenseNumber: row[9] || "", status: row[10], branch: row[11], createdBy: row[12] || "", updatedAt: row[13] || "", updatedBy: row[14] || "", stateChangedAt: row[15] || "", revision: row[16] || "", rowNumber: index + 2 };
  }).filter((moto): moto is Motorcycle => !!moto && moto.branch === branch);
}

export async function getMotorcycle(id: string, branch: Branch) {
  return (await listMotorcycles(branch)).find((moto) => moto.id === id) || null;
}

export async function getMotorcycleHistory(id: string) {
  await ensureMotorcycleWorkbook();
  const response = await client().spreadsheets.values.get({ spreadsheetId: spreadsheetId(), range: `${HISTORY}!A2:H` });
  return (response.data.values || []).filter((row) => row[1] === id).map((row): MotorcycleHistory => ({ id: row[0], motorcycleId: row[1], timestamp: row[2], previousStatus: row[3] || "", newStatus: row[4], username: row[5], action: row[6], details: row[7] || "" }));
}

export async function saveMotorcycle(moto: Motorcycle, history: MotorcycleHistory, creating = false) {
  await ensureMotorcycleWorkbook();
  const sheets = client();
  const id = spreadsheetId();
  const metadata = await sheets.spreadsheets.get({ spreadsheetId: id });
  const sheetId = (title: string) => metadata.data.sheets?.find((sheet) => sheet.properties?.title === title)?.properties?.sheetId;
  const mainId = sheetId(MAIN);
  const historyId = sheetId(HISTORY);
  if (mainId == null || historyId == null) throw new Error("No se encontraron las hojas de motos.");
  const cells = (values: string[]) => ({ values: values.map((value) => ({ userEnteredValue: { stringValue: value } })) });
  const mainRow = cells([moto.id, moto.code, moto.description, moto.brand, moto.chassisNumber, moto.observations, moto.receivedAt, moto.invoiceNumber, moto.idPdfUrl, moto.licenseNumber, moto.status, moto.branch, moto.createdBy, moto.updatedAt, moto.updatedBy, moto.stateChangedAt, moto.revision]);
  const historyRow = cells([history.id, history.motorcycleId, history.timestamp, history.previousStatus, history.newStatus, history.username, history.action, history.details]);
  if (!creating && !moto.rowNumber) throw new Error("No se encontró la fila de la moto.");
  const change: sheets_v4.Schema$Request = creating
    ? { appendCells: { sheetId: mainId, rows: [mainRow], fields: "userEnteredValue" } }
    : { updateCells: { start: { sheetId: mainId, rowIndex: moto.rowNumber! - 1, columnIndex: 0 }, rows: [mainRow], fields: "userEnteredValue" } };
  // Record and history are committed atomically in the independent motorcycle workbook.
  await sheets.spreadsheets.batchUpdate({ spreadsheetId: id, requestBody: { requests: [change, { appendCells: { sheetId: historyId, rows: [historyRow], fields: "userEnteredValue" } }] } });
}
