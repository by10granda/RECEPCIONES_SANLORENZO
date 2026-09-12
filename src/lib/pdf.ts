import jsPDF from "jspdf";
import type { WarrantyWithHistory } from "./types";

type PublicWarranty = {
  code: string;
  customerName: string;
  documentNumber: string;
  invoiceNumber: string;
  productDescription: string;
  productCode: string;
  serialNumber: string;
  saleDate: string;
  receptionDate: string;
  currentStatus: string;
  lastUpdate: string;
  history: { date: string; time: string; newStatus: string }[];
};

function header(doc: jsPDF, title: string) {
  doc.setFillColor(255, 0, 0);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text("DISTRIBUIDOR PUNTO PAS", 14, 12);
  doc.setFontSize(10);
  doc.text("SAN LORENZO", 14, 20);
  doc.setTextColor(23, 32, 38);
  doc.setFontSize(14);
  doc.text(title, 14, 42);
}

function line(doc: jsPDF, label: string, value: string, y: number) {
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`${label}:`, 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(String(value || "-"), 62, y, { maxWidth: 130 });
}

export function downloadAdminWarrantyPdf(w: WarrantyWithHistory) {
  const doc = new jsPDF();
  header(doc, "SISTEMA DE GARANTÍAS");
  let y = 54;
  const rows = [
    ["Código", w.code], ["Fecha de registro", `${w.registeredDate} - ${w.registeredTime}`], ["Estado", w.currentStatus],
    ["Cliente", `${w.customerName} ${w.customerLastName}`], ["Documento", `${w.documentType} ${w.documentNumber}`], ["Teléfono", w.phone], ["Correo", w.email],
    ["Fecha venta", w.saleDate], ["Factura", w.invoiceNumber], ["Producto", w.productDescription], ["Código producto", w.productCode], ["Número serie", w.serialNumber],
    ["Ingreso almacén", w.receptionDate], ["Falla", w.reportedFailure], ["Observaciones", w.observations], ["Vendedor", w.sellerName], ["Empresa", w.company]
  ];
  rows.forEach(([label, value]) => { line(doc, label, value, y); y += 8; if (y > 275) { doc.addPage(); y = 20; } });
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Historial de estados", 14, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  w.history.forEach((h) => { line(doc, `${h.date} ${h.time}`, h.newStatus, y); y += 8; });
  doc.save(`${w.code}.pdf`);
}

export function downloadPublicWarrantyPdf(w: PublicWarranty) {
  const doc = new jsPDF();
  header(doc, "COMPROBANTE DE ESTADO DE GARANTÍA");
  let y = 56;
  [["Código de garantía", w.code], ["Cliente", w.customerName], ["Documento", w.documentNumber], ["Número de factura", w.invoiceNumber], ["Producto", w.productDescription], ["Código", w.productCode], ["Número de serie", w.serialNumber], ["Fecha de venta", w.saleDate], ["Ingreso al almacén", w.receptionDate], ["Estado actual", w.currentStatus], ["Última actualización", w.lastUpdate]].forEach(([label, value]) => { line(doc, label, value, y); y += 8; });
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Historial de estados", 14, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  w.history.forEach((h) => { line(doc, `${h.date} ${h.time}`, h.newStatus, y); y += 8; });
  y += 8;
  doc.text("Este documento corresponde a una consulta informativa del estado de la garantía registrada en Distribuidor Punto PAS.", 14, y, { maxWidth: 180 });
  doc.text(`Generado: ${new Date().toLocaleString("es-EC", { timeZone: "America/Guayaquil" })}`, 14, 286);
  doc.save(`${w.code}-estado.pdf`);
}
