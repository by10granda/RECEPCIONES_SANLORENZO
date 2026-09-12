import { NextRequest } from "next/server";
import { error, handleApiError, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { appendHistory, appendWarranty, generateWarrantyCode, isDuplicate, listWarranties } from "@/lib/sheets";
import { inputDateToDisplay, nowParts } from "@/lib/time";
import { sanitizeObject, warrantySchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireUser();
    return json({ warranties: await listWarranties() });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = warrantySchema.safeParse(sanitizeObject(await request.json()));
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "Datos inválidos", 422);
    const existing = await listWarranties();
    if (!parsed.data.confirmDuplicate && isDuplicate(parsed.data, existing)) return error("Parece existir una garantía duplicada para esta factura, código y serie.", 409);
    const now = nowParts();
    const code = await generateWarrantyCode();
    const warranty = {
      id: crypto.randomUUID(),
      code,
      registeredDate: now.date,
      registeredTime: now.time,
      customerName: parsed.data.customerName,
      customerLastName: parsed.data.customerLastName,
      documentType: parsed.data.documentType,
      documentNumber: parsed.data.documentNumber,
      phone: parsed.data.phone,
      email: parsed.data.email,
      saleDate: inputDateToDisplay(parsed.data.saleDate),
      receptionDate: inputDateToDisplay(parsed.data.receptionDate),
      invoiceNumber: parsed.data.invoiceNumber,
      productDescription: parsed.data.productDescription,
      productCode: parsed.data.productCode,
      serialNumber: parsed.data.serialNumber,
      reportedFailure: parsed.data.reportedFailure,
      observations: parsed.data.observations || "",
      sellerName: parsed.data.sellerName,
      company: "VARIEDADES PAS",
      currentStatus: parsed.data.currentStatus,
      lastUpdate: now.stamp,
      createdBy: user.username
    };
    await appendWarranty(warranty);
    await appendHistory({ id: crypto.randomUUID(), warrantyCode: code, date: now.date, time: now.time, previousStatus: "", newStatus: warranty.currentStatus, responsibleUser: user.username });
    return json({ warranty }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
