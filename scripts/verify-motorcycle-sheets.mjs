import nextEnv from "@next/env";
import { google } from "googleapis";

nextEnv.loadEnvConfig(process.cwd());
const spreadsheetId = process.env.GOOGLE_MOTOS_SHEET_ID;
if (!spreadsheetId || spreadsheetId === process.env.GOOGLE_SHEET_ID) throw new Error("Configure una hoja independiente para motos.");
const auth = new google.auth.JWT({ email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"), scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
const sheets = google.sheets({ version: "v4", auth });
const worksheets = {
  MOTOS: ["ID", "Código", "Descripción", "Marca", "Número de chasis", "Observaciones", "Fecha de ingreso", "Número de factura", "PDF cédula", "Número de matrícula", "Estado", "Sucursal", "Usuario creador", "Última actualización", "Usuario modificador", "Fecha cambio estado", "Revisión"],
  HISTORIAL_MOTOS: ["ID", "ID moto", "Fecha y hora", "Estado anterior", "Estado nuevo", "Usuario", "Acción", "Detalle"]
};

try {
  const metadata = await sheets.spreadsheets.get({ spreadsheetId });
  for (const [title, headers] of Object.entries(worksheets)) {
    let properties = metadata.data.sheets?.find((sheet) => sheet.properties?.title === title)?.properties;
    if (!properties) {
      const added = await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ addSheet: { properties: { title, gridProperties: { columnCount: headers.length } } } }] } });
      properties = added.data.replies?.[0].addSheet?.properties;
      console.log(`Hoja creada: ${title}`);
    }
    const existing = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${title}!1:1` });
    const actual = existing.data.values?.[0] || [];
    if (actual.length && headers.some((header, index) => actual[index] !== header)) throw new Error(`Encabezados diferentes en ${title}; no se sobrescribieron datos.`);
    if (!actual.length) {
      if ((properties?.gridProperties?.columnCount || 0) < headers.length) await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ updateSheetProperties: { properties: { sheetId: properties?.sheetId, gridProperties: { columnCount: headers.length } }, fields: "gridProperties.columnCount" } }] } });
      await sheets.spreadsheets.values.update({ spreadsheetId, range: `${title}!A1`, valueInputOption: "RAW", requestBody: { values: [headers] } });
      console.log(`Encabezados creados: ${title}`);
    }
  }
  console.log("Hoja independiente de motos conectada correctamente.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
