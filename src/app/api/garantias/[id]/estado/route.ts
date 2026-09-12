import { NextRequest } from "next/server";
import { error, handleApiError, json } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { appendHistory, getWarranty, updateWarranty } from "@/lib/sheets";
import { nowParts } from "@/lib/time";
import { statusUpdateSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const warranty = await getWarranty(decodeURIComponent(id));
    if (!warranty) return error("Garantía no encontrada", 404);
    const parsed = statusUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return error("Estado inválido", 422);
    if (parsed.data.newStatus === warranty.currentStatus) return json({ warranty });
    const now = nowParts();
    const updated = { ...warranty, currentStatus: parsed.data.newStatus, lastUpdate: now.stamp, modifiedAt: now.stamp, modifiedBy: user.username };
    await updateWarranty(updated);
    await appendHistory({ id: crypto.randomUUID(), warrantyCode: warranty.code, date: now.date, time: now.time, previousStatus: warranty.currentStatus, newStatus: parsed.data.newStatus, responsibleUser: user.username });
    return json({ warranty: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
