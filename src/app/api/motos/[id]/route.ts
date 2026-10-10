import { NextRequest } from "next/server";
import { error, handleApiError, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { deleteMotorcycle, getMotorcycle, getMotorcycleHistory, listMotorcycles, saveMotorcycle } from "@/lib/motorcycle-sheets";
import { motorcycleEditSchema, requiredMotorcycleFields } from "@/lib/motorcycle-validation";
import { validateIdPdfUrl } from "@/lib/motorcycle-pdf";
import { sanitizeObject } from "@/lib/validators";
import { nowParts } from "@/lib/time";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, context: Context) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const motorcycle = await getMotorcycle(id, user.branch);
    if (!motorcycle) return error("Moto no encontrada", 404);
    return json({ motorcycle, history: await getMotorcycleHistory(id) });
  } catch (err) { return handleApiError(err); }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const current = await getMotorcycle(id, user.branch);
    if (!current) return error("Moto no encontrada", 404);
    const parsed = motorcycleEditSchema.safeParse(sanitizeObject(await request.json()));
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "Datos inválidos", 422);
    if (parsed.data.revision !== current.revision) return error("La moto fue modificada por otro usuario. Recargue antes de guardar.", 409);
    const requiredError = requiredMotorcycleFields(current.status, parsed.data);
    if (requiredError) return error(requiredError, 422);
    if (parsed.data.idPdfUrl && parsed.data.idPdfUrl !== current.idPdfUrl) {
      const pdfError = await validateIdPdfUrl(parsed.data.idPdfUrl);
      if (pdfError) return error(pdfError, 422);
    }
    const existing = await listMotorcycles(user.branch);
    if (existing.some((moto) => moto.id !== id && moto.chassisNumber.toUpperCase() === parsed.data.chassisNumber.toUpperCase())) return error("Ya existe una moto con ese número de chasis en esta sucursal.", 409);
    const now = nowParts();
    const changes = Object.entries(parsed.data).filter(([key, value]) => key !== "revision" && current[key as keyof typeof current] !== value).map(([field, value]) => ({ field, before: current[field as keyof typeof current], after: value }));
    if (!changes.length) return json({ motorcycle: current });
    const motorcycle = { ...current, ...parsed.data, updatedAt: now.stamp, updatedBy: user.username, revision: crypto.randomUUID() };
    await saveMotorcycle(motorcycle, { id: crypto.randomUUID(), motorcycleId: id, timestamp: now.stamp, previousStatus: current.status, newStatus: current.status, username: user.username, action: "EDICION", details: JSON.stringify(changes) });
    return json({ motorcycle });
  } catch (err) { return handleApiError(err); }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await request.json();
    if (typeof body?.revision !== "string" || !body.revision || body.revision.length > 100) return error("Recargue la moto antes de borrarla.", 422);
    const result = await deleteMotorcycle(id, user.branch, body.revision);
    if (result.error === "missing") return error("Moto no encontrada", 404);
    if (result.error === "conflict") return error("La moto fue modificada por otro usuario. Recargue y confirme nuevamente antes de borrarla.", 409);
    return json({ ok: true, deleted: result.deleted });
  } catch (err) { return handleApiError(err); }
}
