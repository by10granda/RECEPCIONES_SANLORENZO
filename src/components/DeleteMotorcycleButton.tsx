"use client";

import { useRef, useState } from "react";
import type { Motorcycle } from "@/lib/motorcycles";

export function DeleteMotorcycleButton({ motorcycle, disabled, onDeleted }: { motorcycle: Motorcycle; disabled?: boolean; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);

  async function remove() {
    if (disabled || submitting.current) return;
    if (!window.confirm(`¿Está seguro de borrar por completo la moto ${motorcycle.code}, chasis ${motorcycle.chassisNumber}, de ${motorcycle.branch}?\n\nSe eliminarán todos sus datos y su historial. Esta acción no se puede deshacer. El archivo del enlace externo no se elimina.`)) return;
    submitting.current = true;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/motos/${encodeURIComponent(motorcycle.id)}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revision: motorcycle.revision }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo borrar la moto.");
      onDeleted();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo conectar. Recargue el listado para comprobar si se borró la moto.");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return <div className="print:hidden"><button type="button" className="btn-secondary whitespace-nowrap border-red-200 text-red-700 disabled:opacity-50" disabled={disabled || loading} onClick={() => void remove()}>{loading ? "Borrando..." : "Borrar"}<span className="sr-only"> {motorcycle.code}</span></button>{error && <p role="alert" className="mt-2 max-w-sm text-sm font-semibold text-red-700">{error}</p>}</div>;
}
