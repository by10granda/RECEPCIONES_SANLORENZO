"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BRANCHES, isBranch, type Branch } from "@/lib/branches";

export function AdminNav() {
  const [username, setUsername] = useState("");
  const [branch, setBranch] = useState<Branch | "">("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me", { signal: controller.signal, cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo cargar la sesión.");
        const data = await res.json();
        if (!isBranch(data.user?.branch)) throw new Error("No se pudo cargar la sucursal de la sesión.");
        setUsername(data.user?.username || "");
        setBranch(data.user.branch);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "No se pudo cargar la sesión.");
        }
      } finally {
        if (!controller.signal.aborted) setLoadingUser(false);
      }
    }
    void loadUser();
    return () => controller.abort();
  }, []);

  async function logout(selected?: Branch) {
    if (loading || (selected && selected === branch)) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        setError("No se pudo cerrar la sesión. Intenta nuevamente.");
        setLoading(false);
        return;
      }
      window.location.assign(selected ? "/login?branch=" + encodeURIComponent(selected) : "/login");
    } catch {
      setError("No se pudo conectar con el servidor. Intenta nuevamente.");
      setLoading(false);
    }
  }
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-pasRed">Distribuidor Punto PAS</p>
          <h1 className="text-xl font-black">Sistema de Garantías</h1>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {username && <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700">Usuario: {username}</div>}
            <label className="flex flex-col gap-1 text-sm font-bold text-slate-700 sm:flex-row sm:items-center sm:gap-2">
              <span>Sucursal{branch ? `: ${branch}` : ""}</span>
              <select
                className="field w-full sm:w-auto"
                value={branch}
                disabled={loadingUser || loading || !branch}
                onChange={(e) => {
                  const selected = e.target.value;
                  if (isBranch(selected)) void logout(selected);
                }}
              >
                {!branch && <option value="">{loadingUser ? "Cargando sucursal..." : "Sucursal no disponible"}</option>}
                {BRANCHES.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>
          {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
          <nav className="flex flex-wrap gap-2">
            <Link className="btn-secondary py-2" href="/admin">Panel</Link>
            <Link className="btn-secondary py-2" href="/admin/garantias">Garantías</Link>
            <Link className="btn-green py-2" href="/admin/garantias/nueva">Nueva garantía</Link>
            <Link className="btn-secondary py-2" href="/admin/reportes">Reportes</Link>
            <button className="btn-primary py-2" disabled={loading} onClick={() => void logout()}>{loading ? "Cerrando sesión..." : "Cerrar sesión"}</button>
          </nav>
        </div>
      </div>
    </header>
  );
}
