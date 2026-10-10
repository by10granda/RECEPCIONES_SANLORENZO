import { z } from "zod";
import { MOTORCYCLE_STATUSES, type MotorcycleStatus } from "./motorcycles";

const text = z.string().trim().max(2000, "El texto excede el tamaño permitido");
const required = text.min(1, "Complete los campos obligatorios");
export const motorcycleCreateSchema = z.object({ code: required.max(100), description: required, brand: required.max(100), chassisNumber: required.max(100) });
export const motorcycleEditSchema = motorcycleCreateSchema.extend({ observations: text, invoiceNumber: text.max(100), idPdfUrl: text, licenseNumber: text.max(100), revision: required });
export const motorcycleStatusSchema = z.object({ status: z.enum(MOTORCYCLE_STATUSES), observations: text.optional(), invoiceNumber: text.max(100).optional(), idPdfUrl: text.optional(), licenseNumber: text.max(100).optional(), revision: required });

export function requiredMotorcycleFields(status: MotorcycleStatus, data: { invoiceNumber: string; observations: string; idPdfUrl: string; licenseNumber: string }) {
  if (status !== "DISPONIBLE" && (!data.invoiceNumber || !data.observations || !data.idPdfUrl)) return "Para una moto vendida debe ingresar factura, observaciones y enlace al PDF de la cédula.";
  if (status === "MATRICULA ENTREGADA" && !data.licenseNumber) return "Debe ingresar el número de matrícula.";
  return null;
}
