import { strToU8, zipSync } from "fflate";
import jsPDF from "jspdf";
import type { Warranty } from "./types";

function xml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function col(index: number) {
  let s = "";
  while (index >= 0) { s = String.fromCharCode((index % 26) + 65) + s; index = Math.floor(index / 26) - 1; }
  return s;
}

export function exportWarrantiesExcel(rows: Warranty[], filename = "garantias.xlsx") {
  const table = [["Código de garantía", "Cliente", "Documento", "Teléfono", "Factura", "Producto", "Marca", "Proveedor", "Teléfono proveedor", "Código producto", "Serie", "Fecha recepción", "Estado", "Última actualización", "Vendedor"], ...rows.map((w) => [w.code, `${w.customerName} ${w.customerLastName}`, `${w.documentType} ${w.documentNumber}`, w.phone, w.invoiceNumber, w.productDescription, w.brand, w.providerName, w.providerPhone, w.productCode, w.serialNumber, w.receptionDate, w.currentStatus, w.lastUpdate, w.sellerName])];
  const sheetRows = table.map((row, r) => `<row r="${r + 1}">${row.map((cell, c) => `<c r="${col(c)}${r + 1}" t="inlineStr"><is><t>${xml(String(cell || ""))}</t></is></c>`).join("")}</row>`).join("");
  const files = {
    "[Content_Types].xml": strToU8('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'),
    "_rels/.rels": strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
    "xl/workbook.xml": strToU8('<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="GARANTIAS" sheetId="1" r:id="rId1"/></sheets></workbook>'),
    "xl/_rels/workbook.xml.rels": strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'),
    "xl/worksheets/sheet1.xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`)
  };
  const blob = new Blob([zipSync(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportWarrantiesPdf(rows: Warranty[], filename = "garantias.pdf") {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFillColor(255, 0, 0);
  doc.rect(0, 0, 297, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("DISTRIBUIDOR PUNTO PAS - SISTEMA DE GARANTÍAS", 12, 15);
  doc.setTextColor(23, 32, 38);
  doc.setFontSize(9);
  let y = 36;
  rows.forEach((w, idx) => {
    if (y > 194) { doc.addPage(); y = 18; }
    doc.text(`${idx + 1}. ${w.code} | ${w.customerName} ${w.customerLastName} | Factura: ${w.invoiceNumber} | ${w.productDescription} | Marca: ${w.brand || "-"} | Proveedor: ${w.providerName || "-"} | Serie: ${w.serialNumber} | ${w.currentStatus}`, 12, y, { maxWidth: 272 });
    y += 8;
  });
  doc.save(filename);
}
