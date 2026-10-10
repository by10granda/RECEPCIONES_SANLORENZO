import fs from "node:fs";
import assert from "node:assert/strict";
import { google } from "googleapis";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
// Additional test credentials arrive on stdin, never in tracked files.
const additionalAccounts = JSON.parse(fs.readFileSync(0, "utf8"));
const accounts = [
  { username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD, branch: "SAN LORENZO" },
  ...JSON.parse(process.env.ADMIN_USERS_JSON || "[]").map((account) => ({ ...account, branch: "SAN LORENZO" })),
  ...additionalAccounts.map((account) => ({ ...account, branch: "ALMACEN PAS" }))
];

async function request(path, method = "GET", body, cookie) {
  let response;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      break;
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  const data = await response.json();
  return { response, data, cookie: response.headers.get("set-cookie")?.split(";")[0] };
}

const sessions = new Map();
for (const account of accounts) {
  const correct = await request("/api/auth/login", "POST", account);
  assert.equal(correct.response.status, 200, `${account.username}: login`);
  assert.ok(correct.cookie, "Session cookie required");
  sessions.set(account.branch, correct.cookie);
  const otherBranch = account.branch === "SAN LORENZO" ? "ALMACEN PAS" : "SAN LORENZO";
  const wrong = await request("/api/auth/login", "POST", { ...account, branch: otherBranch });
  assert.equal(wrong.response.status, 401, "Account must not access the other branch");
  const me = await request("/api/auth/me", "GET", undefined, correct.cookie);
  assert.equal(me.data.user?.branch, account.branch);
  console.log(`${account.username}: login y restriccion de sucursal correctos`);
}

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});
const sheets = google.sheets({ version: "v4", auth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID;
const created = [];
const wait = () => new Promise((resolve) => setTimeout(resolve, 20000));
try {
  const unique = crypto.randomUUID();
  for (const branch of ["SAN LORENZO", "ALMACEN PAS"]) {
    const result = await request("/api/garantias", "POST", {
      customerName: "PRUEBA AUTOMATICA", customerLastName: "SUCURSAL",
      documentType: "Pasaporte", documentNumber: `TEST-${unique}-${branch}`,
      phone: "0990000000", email: "", saleDate: "2026-10-10", receptionDate: "2026-10-10",
      invoiceNumber: `TEST-${unique}-${branch}`, productDescription: "REGISTRO TEMPORAL DE PRUEBA",
      productCode: "TEST", serialNumber: unique, brand: "PRUEBA",
      providerName: "PROVEEDOR PRUEBA", providerPhone: "0999999999",
      reportedFailure: "Prueba de aislamiento", observations: "Se elimina al terminar la prueba",
      sellerName: "PRUEBA", branch: branch === "SAN LORENZO" ? "ALMACEN PAS" : "SAN LORENZO"
    }, sessions.get(branch));
    assert.equal(result.response.status, 201, result.data.error);
    created.push({ ...result.data.warranty, cookie: sessions.get(branch) });
    console.log(`Registro temporal creado en ${branch}`);
    assert.equal(result.data.warranty.branch, branch, "Server must ignore branch supplied by client");
    await wait();
  }
  const persisted = await sheets.spreadsheets.values.get({ spreadsheetId, range: "GARANTIAS!A:AC" });
  for (const record of created) {
    const row = persisted.data.values.find((entry) => entry[0] === record.id);
    assert.equal(row?.[28], record.branch, "Branch persisted in Sheets");
    assert.equal(row?.[26], record.providerName);
    assert.equal(row?.[27], record.providerPhone);
    const other = record.branch === "SAN LORENZO" ? "ALMACEN PAS" : "SAN LORENZO";
    for (const [method, suffix, body] of [
      ["GET", "", undefined], ["PUT", "", { customerName: "NO CAMBIAR" }],
      ["POST", "/estado", { newStatus: "PRODUCTO ENTREGADO AL CLIENTE" }], ["DELETE", "", undefined]
    ]) {
      const result = await request(`/api/garantias/${record.id}${suffix}`, method, body, sessions.get(other));
      assert.equal(result.response.status, 404, `${method}: cross-branch access denied`);
      await wait();
    }
    const list = await request("/api/garantias", "GET", undefined, record.cookie);
    assert.ok(list.data.warranties.some((entry) => entry.id === record.id));
    assert.ok(list.data.warranties.every((entry) => entry.branch === record.branch));
    await wait();
  }
  console.log("Persistencia en Sheets y aislamiento de lectura, edicion, estados y eliminacion: correctos.");
} finally {
  for (const record of created) {
    const removed = await request(`/api/garantias/${record.id}`, "DELETE", undefined, record.cookie);
    assert.equal(removed.response.status, 200, removed.data.error);
    await wait();
  }
  if (created.length) console.log("Registros temporales e historial eliminados.");
}
const logout = await request("/api/auth/logout", "POST", undefined, sessions.get("ALMACEN PAS"));
assert.equal(logout.response.status, 200);
assert.match(logout.response.headers.get("set-cookie"), /Max-Age=0/i);
console.log("Cierre de sesion para cambio de sucursal: correcto.");
