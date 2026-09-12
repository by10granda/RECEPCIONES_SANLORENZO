import { NextRequest } from "next/server";
import { error, handleApiError, json } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limit";
import { getWarranty, listWarranties } from "@/lib/sheets";
import { publicQuerySchema, sanitizeObject } from "@/lib/validators";

function maskDocument(value: string) {
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}${"*".repeat(Math.max(value.length - 4, 2))}${value.slice(-2)}`;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
    if (!checkRateLimit(ip)) return error("Demasiadas consultas. Intente nuevamente en unos minutos.", 429);
    const parsed = publicQuerySchema.safeParse(sanitizeObject(await request.json()));
    if (!parsed.success) return error("Ingrese documento o factura", 422);
    const warranties = await listWarranties();
    const qDoc = parsed.data.documentNumber.toLowerCase();
    const qInv = parsed.data.invoiceNumber.toLowerCase();
    const matches = warranties.filter((w) => {
      const docOk = qDoc && w.documentNumber.toLowerCase() === qDoc;
      const invOk = qInv && w.invoiceNumber.toLowerCase() === qInv;
      return docOk || invOk;
    }).slice(0, 10);
    const result = await Promise.all(matches.map((w) => getWarranty(w.id)));
    return json({
      warranties: result.filter(Boolean).map((w) => ({
        id: w!.id,
        code: w!.code,
        customerName: `${w!.customerName} ${w!.customerLastName}`,
        documentNumber: maskDocument(w!.documentNumber),
        invoiceNumber: w!.invoiceNumber,
        productDescription: w!.productDescription,
        productCode: w!.productCode,
        serialNumber: w!.serialNumber,
        saleDate: w!.saleDate,
        receptionDate: w!.receptionDate,
        currentStatus: w!.currentStatus,
        lastUpdate: w!.lastUpdate,
        history: w!.history.map((h) => ({ date: h.date, time: h.time, newStatus: h.newStatus }))
      }))
    });
  } catch (err) {
    return handleApiError(err);
  }
}
