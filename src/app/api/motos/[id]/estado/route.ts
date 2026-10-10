import { NextRequest } from "next/server";
import { error, handleApiError, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getMotorcycle, saveMotorcycle } from "@/lib/motorcycle-sheets";
import { motorcycleStatusSchema, requiredMotorcycleFields } from "@/lib/motorcycle-validation";
import { validateIdPdfUrl } from "@/lib/motorcycle-pdf";
import { sanitizeObject } from "@/lib/validators";
import { nowParts } from "@/lib/time";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const current = await getMotorcycle(id, user.branch);
    if (!current) return error("Moto no encontrada", 404);
    const parsed = motorcycleStatusSchema.safeParse(sanitizeObject(await request.json()));
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "Datos inválidos", 422);
    if (parsed.data.revision !== current.revision) return error("La moto fue modificada por otro usuario. Recargue antes de guardar.", 409);
    if (current.status === parsed.data.status) return error("Seleccione un estado diferente. Para corregir datos use Editar.", 422);
    if (current.status === "DISPONIBLE" && parsed.data.status === "MATRICULA ENTREGADA") return error("Primero registre la venta con matrícula en proceso.", 422);
    const motorcycle = { ...current, ...parsed.data };
    const requiredError = requiredMotorcycleFields(motorcycle.status, motorcycle);
    if (requiredError) return error(requiredError, 422);
    if (motorcycle.idPdfUrl && motorcycle.idPdfUrl !== current.idPdfUrl) {
      const pdfError = await validateIdPdfUrl(motorcycle.idPdfUrl);
      if (pdfError) return error(pdfError, 422);
    }
    const now = nowParts();
    motorcycle.stateChangedAt = now.stamp;
    motorcycle.updatedAt = now.stamp;
    motorcycle.updatedBy = user.username;
    motorcycle.revision = crypto.randomUUID();
    const changes = Object.entries(parsed.data).filter(([key, value]) => key !== "revision" && current[key as keyof typeof current] !== value).map(([field, value]) => ({ field, before: current[field as keyof typeof current], after: value }));
    await saveMotorcycle(motorcycle, { id: crypto.randomUUID(), motorcycleId: id, timestamp: now.stamp, previousStatus: current.status, newStatus: motorcycle.status, username: user.username, action: "ESTADO", details: JSON.stringify(changes) });
    return json({ motorcycle });
  } catch (err) { return handleApiError(err); }
}
