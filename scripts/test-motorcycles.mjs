import fs from "node:fs";
import assert from "node:assert/strict";
import nextEnv from "@next/env";
import { google } from "googleapis";

nextEnv.loadEnvConfig(process.cwd());
const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const almacenAccount = JSON.parse(fs.readFileSync(0, "utf8"));
const auth = new google.auth.JWT({ email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"), scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
const sheets = google.sheets({ version: "v4", auth });
google.options({ timeout: 30000 });
const spreadsheetId = process.env.GOOGLE_MOTOS_SHEET_ID;
assert.notEqual(spreadsheetId, process.env.GOOGLE_SHEET_ID);
const testCode = `TEST-MOTOS-${crypto.randomUUID()}`;
const sessions = new Map();
const pause = () => new Promise((resolve) => setTimeout(resolve, 3000));

async function request(path, method = "GET", body, cookie) {
  await pause();
  const response = await fetch(`${baseUrl}${path}`, { method, signal: AbortSignal.timeout(30000), headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] };
}

for (const account of [{ username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD, branch: "SAN LORENZO" }, { ...almacenAccount, branch: "ALMACEN PAS" }]) {
  const login = await request("/api/auth/login", "POST", account);
  assert.equal(login.status, 200);
  sessions.set(account.branch, login.cookie);
}

const guaranteesBefore = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.GOOGLE_SHEET_ID, range: "GARANTIAS!A:AC" });
try {
  assert.equal((await request("/api/motos")).status, 401);
  const motos = [];
  for (const branch of ["SAN LORENZO", "ALMACEN PAS"]) {
    const result = await request("/api/motos", "POST", { code: `${testCode}-${branch}`, description: "REGISTRO TEMPORAL PRUEBA MOTOS", brand: "PRUEBA", chassisNumber: `${testCode}-${branch}`, status: "MATRICULA ENTREGADA", branch: branch === "SAN LORENZO" ? "ALMACEN PAS" : "SAN LORENZO" }, sessions.get(branch));
    assert.equal(result.status, 201, result.data.error);
    assert.equal(result.data.motorcycle.status, "DISPONIBLE");
    assert.equal(result.data.motorcycle.branch, branch);
    assert.ok(result.data.motorcycle.receivedAt);
    motos.push(result.data.motorcycle);
  }
  for (const moto of motos) {
    const otherBranch = moto.branch === "SAN LORENZO" ? "ALMACEN PAS" : "SAN LORENZO";
    assert.equal((await request(`/api/motos/${moto.id}`, "GET", undefined, sessions.get(otherBranch))).status, 404);
    assert.equal((await request(`/api/motos/${moto.id}`, "PUT", {}, sessions.get(otherBranch))).status, 404);
    assert.equal((await request(`/api/motos/${moto.id}/estado`, "POST", {}, sessions.get(otherBranch))).status, 404);
    const list = await request("/api/motos", "GET", undefined, sessions.get(moto.branch));
    assert.ok(list.data.motorcycles.some((entry) => entry.id === moto.id));
    assert.ok(list.data.motorcycles.every((entry) => entry.branch === moto.branch));
  }
  let moto = motos[0];
  const cookie = sessions.get(moto.branch);
  const change = (body) => request(`/api/motos/${moto.id}/estado`, "POST", { revision: moto.revision, ...body }, cookie);
  assert.equal((await change({ status: "VENDIDA CON MATRICULA EN PROCESO" })).status, 422);
  const sale = { status: "VENDIDA CON MATRICULA EN PROCESO", invoiceNumber: "FACTURA-PRUEBA", observations: "Venta de prueba", idPdfUrl: "https://example.com/cedula.jpg" };
  assert.equal((await change({ ...sale, idPdfUrl: "javascript:alert(1)" })).status, 422);
  assert.equal((await change({ ...sale, idPdfUrl: "http://example.com/cedula.pdf" })).status, 422);
  const sold = await change({ ...sale, idPdfUrl: "https://drive.google.com/file/d/documento-de-prueba/view?usp=sharing" });
  assert.equal(sold.status, 200, sold.data.error);
  const staleRevision = moto.revision;
  moto = sold.data.motorcycle;
  assert.equal((await request(`/api/motos/${moto.id}/estado`, "POST", { status: "DISPONIBLE", revision: staleRevision }, cookie)).status, 409);
  assert.equal((await change({ status: "MATRICULA ENTREGADA" })).status, 422);
  const delivered = await change({ status: "MATRICULA ENTREGADA", licenseNumber: "PRUEBA-001" });
  assert.equal(delivered.status, 200, delivered.data.error);
  moto = delivered.data.motorcycle;
  const reversed = await change({ status: "VENDIDA CON MATRICULA EN PROCESO" });
  assert.equal(reversed.status, 200, reversed.data.error);
  moto = reversed.data.motorcycle;
  const edited = await request(`/api/motos/${moto.id}`, "PUT", { ...moto, description: "DESCRIPCION CORREGIDA PRUEBA", observations: "Observación corregida" }, cookie);
  assert.equal(edited.status, 200, edited.data.error);
  moto = edited.data.motorcycle;
  const available = await change({ status: "DISPONIBLE" });
  assert.equal(available.status, 200, available.data.error);
  assert.equal(available.data.motorcycle.invoiceNumber, "FACTURA-PRUEBA");
  assert.equal(available.data.motorcycle.licenseNumber, "PRUEBA-001");
  const detail = await request(`/api/motos/${moto.id}`, "GET", undefined, cookie);
  assert.equal(detail.data.history.length, 6);
  assert.ok(detail.data.history.some((entry) => entry.action === "EDICION"));
  const persisted = await sheets.spreadsheets.values.get({ spreadsheetId, range: "MOTOS!A2:Q" });
  const stored = persisted.data.values.find((row) => row[0] === moto.id);
  assert.equal(stored[2], "DESCRIPCION CORREGIDA PRUEBA");
  assert.equal(stored[8], "https://drive.google.com/file/d/documento-de-prueba/view?usp=sharing");
  assert.equal(stored[9], "PRUEBA-001");
  assert.equal(stored[11], "SAN LORENZO");
  const guaranteesAfter = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.GOOGLE_SHEET_ID, range: "GARANTIAS!A:AC" });
  assert.deepEqual(guaranteesAfter.data.values, guaranteesBefore.data.values, "La prueba no debe modificar las garantías");
  console.log("Prueba correcta: registro, fechas, campos obligatorios, PDF, edición, retrocesos e historial.");
  console.log("Aislamiento entre sucursales y guardado en hoja independiente: correctos. Garantías sin cambios.");
} finally {
  const metadata = await sheets.spreadsheets.get({ spreadsheetId });
  const values = await sheets.spreadsheets.values.get({ spreadsheetId, range: "MOTOS!A2:Q" });
  const records = (values.data.values || []).map((row, index) => ({ row, index })).filter(({ row }) => row[1]?.startsWith(testCode));
  const ids = new Set(records.map(({ row }) => row[0]));
  const history = await sheets.spreadsheets.values.get({ spreadsheetId, range: "HISTORIAL_MOTOS!A2:H" });
  const movements = (history.data.values || []).map((row, index) => ({ row, index })).filter(({ row }) => ids.has(row[1]));
  const requests = [];
  for (const [title, rows] of [["MOTOS", records], ["HISTORIAL_MOTOS", movements]]) {
    const sheetId = metadata.data.sheets.find((sheet) => sheet.properties.title === title).properties.sheetId;
    for (const { index } of rows.sort((a, b) => b.index - a.index)) requests.push({ deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: index + 1, endIndex: index + 2 } } });
  }
  if (requests.length) await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
  console.log(`Registros de prueba eliminados: ${records.length}; historial temporal eliminado: ${movements.length}.`);
}
