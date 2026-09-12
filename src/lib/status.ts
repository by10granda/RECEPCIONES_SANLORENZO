import type { WarrantyStatus } from "./types";

export function statusClass(status: WarrantyStatus | string) {
  if (status === "PRODUCTO ENTREGADO AL CLIENTE") return "bg-green-100 text-green-800 border-green-200";
  if (status === "PRODUCTO LLEGADO AL ALMACEN") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "PRODUCTO ENVIADO AL PROVEEDOR") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-blue-100 text-blue-800 border-blue-200";
}
