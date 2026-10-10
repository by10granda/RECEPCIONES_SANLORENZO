import type { MotorcycleStatus } from "@/lib/motorcycles";

export function MotoBadge({ status }: { status: MotorcycleStatus }) {
  const color = status === "DISPONIBLE"
    ? "border-green-200 bg-green-50 text-green-800"
    : status === "MATRICULA ENTREGADA"
      ? "border-blue-200 bg-blue-50 text-blue-800"
      : "border-amber-200 bg-amber-50 text-amber-800";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${color}`}>{status}</span>;
}
