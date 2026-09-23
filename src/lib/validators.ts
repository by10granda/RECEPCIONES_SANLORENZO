import { z } from "zod";
import { WARRANTY_STATUSES } from "./types";

const required = z.string().trim().min(1, "Campo obligatorio");

export const warrantySchema = z.object({
  customerName: required,
  customerLastName: required,
  documentType: z.enum(["Cédula", "Pasaporte"]),
  documentNumber: required,
  phone: required,
  email: z.string().trim().email("Correo inválido").or(z.literal("")),
  saleDate: required,
  receptionDate: required,
  invoiceNumber: required,
  productDescription: required,
  productCode: required,
  brand: z.string().trim().optional().default(""),
  providerName: z.string().trim().optional().default(""),
  providerPhone: z.string().trim().optional().default(""),
  serialNumber: required,
  reportedFailure: required,
  observations: z.string().trim().optional().default(""),
  sellerName: required,
  currentStatus: z.enum(WARRANTY_STATUSES).default("PRODUCTO RECIBIDO EN EL ALMACEN"),
  confirmDuplicate: z.boolean().optional().default(false)
});

export const warrantyUpdateSchema = warrantySchema.omit({ confirmDuplicate: true }).partial().extend({
  id: required.optional(),
  code: required.optional()
});

export const statusUpdateSchema = z.object({
  newStatus: z.enum(WARRANTY_STATUSES)
});

export const publicQuerySchema = z.object({
  documentNumber: z.string().trim().optional().default(""),
  invoiceNumber: z.string().trim().optional().default("")
}).refine((v) => v.documentNumber || v.invoiceNumber, "Ingrese documento o factura");

export function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

export function sanitizeObject<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, typeof value === "string" ? cleanText(value) : value])) as T;
}
