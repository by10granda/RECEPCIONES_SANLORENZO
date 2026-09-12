import { WARRANTY_STATUSES } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function Timeline({ history, currentStatus }: { history: { date: string; time: string; newStatus: string }[]; currentStatus: string }) {
  return (
    <div className="space-y-4">
      {WARRANTY_STATUSES.map((status) => {
        const item = history.find((h) => h.newStatus === status);
        const done = Boolean(item) || currentStatus === status;
        return (
          <div key={status} className="flex gap-3">
            <div className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full border text-sm font-black ${done ? "border-pasGreen bg-pasGreen text-slate-950" : "border-slate-300 bg-white text-slate-400"}`}>{done ? "✓" : "○"}</div>
            <div>
              <StatusBadge status={status} />
              <p className="mt-1 text-sm text-slate-500">{item ? `${item.date} - ${item.time}` : currentStatus === status ? "Estado actual" : "Pendiente"}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
