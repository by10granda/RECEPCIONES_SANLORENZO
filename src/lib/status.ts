import type { WarrantyStatus } from "./types";

export function statusClass(status: WarrantyStatus | string) {
  if (status === "RETIRAR EN ALMACÉN") return "bg-green-100 text-green-800 border-green-200";
  if (status === "PRODUCTO ENVIADO PARA REVISIÓN") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-blue-100 text-blue-800 border-blue-200";
}
