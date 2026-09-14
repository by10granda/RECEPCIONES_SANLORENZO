import { NextRequest } from "next/server";
import { error, handleApiError, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { deleteWarrantyWithHistory, getWarranty, isDuplicate, listWarranties, updateWarranty } from "@/lib/sheets";
import { inputDateToDisplay, nowParts } from "@/lib/time";
import { sanitizeObject, warrantyUpdateSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, ctx: Ctx) {
  try {
    await requireUser();
    const { id } = await ctx.params;
    const warranty = await getWarranty(decodeURIComponent(id));
    if (!warranty) return error("Garantía no encontrada", 404);
    return json({ warranty });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const current = await getWarranty(decodeURIComponent(id));
    if (!current) return error("Garantía no encontrada", 404);
    const parsed = warrantyUpdateSchema.safeParse(sanitizeObject(await request.json()));
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "Datos inválidos", 422);
    const incoming = parsed.data;
    const updated = {
      ...current,
      ...incoming,
      code: current.code,
      id: current.id,
      saleDate: incoming.saleDate ? inputDateToDisplay(incoming.saleDate) : current.saleDate,
      receptionDate: incoming.receptionDate ? inputDateToDisplay(incoming.receptionDate) : current.receptionDate,
      company: "VARIEDADES PAS",
      modifiedAt: nowParts().stamp,
      modifiedBy: user.username
    };
    const existing = await listWarranties();
    if (isDuplicate(updated, existing, updated.id)) return error("Parece existir una garantía duplicada para esta factura, código y serie.", 409);
    await updateWarranty(updated);
    return json({ warranty: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_: NextRequest, ctx: Ctx) {
  try {
    await requireUser();
    const { id } = await ctx.params;
    const deleted = await deleteWarrantyWithHistory(decodeURIComponent(id));
    if (!deleted) return error("Garantía no encontrada", 404);
    return json({ ok: true, deleted: { id: deleted.id, code: deleted.code } });
  } catch (err) {
    return handleApiError(err);
  }
}
