import { NextRequest } from "next/server";
import { error, handleApiError, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { listMotorcycles, saveMotorcycle } from "@/lib/motorcycle-sheets";
import { motorcycleCreateSchema } from "@/lib/motorcycle-validation";
import { sanitizeObject } from "@/lib/validators";
import { nowParts } from "@/lib/time";
import type { Motorcycle } from "@/lib/motorcycles";

export async function GET() {
  try {
    const user = await requireUser();
    return json({ motorcycles: await listMotorcycles(user.branch) });
  } catch (err) { return handleApiError(err); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = motorcycleCreateSchema.safeParse(sanitizeObject(await request.json()));
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "Datos inválidos", 422);
    const existing = await listMotorcycles(user.branch);
    if (existing.some((moto) => moto.chassisNumber.toUpperCase() === parsed.data.chassisNumber.toUpperCase())) return error("Ya existe una moto con ese número de chasis en esta sucursal.", 409);
    const now = nowParts();
    const motorcycle: Motorcycle = { ...parsed.data, id: crypto.randomUUID(), observations: "", invoiceNumber: "", idPdfUrl: "", licenseNumber: "", status: "DISPONIBLE", branch: user.branch, receivedAt: now.stamp, stateChangedAt: now.stamp, updatedAt: now.stamp, createdBy: user.username, updatedBy: user.username, revision: crypto.randomUUID() };
    await saveMotorcycle(motorcycle, { id: crypto.randomUUID(), motorcycleId: motorcycle.id, timestamp: now.stamp, previousStatus: "", newStatus: "DISPONIBLE", username: user.username, action: "REGISTRO", details: "Ingreso de moto a la sucursal" }, true);
    return json({ motorcycle }, 201);
  } catch (err) { return handleApiError(err); }
}
