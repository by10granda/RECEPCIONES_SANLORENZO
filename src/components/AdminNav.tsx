"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function AdminNav() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-pasRed">Distribuidor Punto PAS</p>
          <h1 className="text-xl font-black">Sistema de Garantías</h1>
        </div>
        <nav className="flex flex-wrap gap-2">
          <Link className="btn-secondary py-2" href="/admin">Panel</Link>
          <Link className="btn-secondary py-2" href="/admin/garantias">Garantías</Link>
          <Link className="btn-green py-2" href="/admin/garantias/nueva">Nueva garantía</Link>
          <Link className="btn-secondary py-2" href="/admin/reportes">Reportes</Link>
          <button className="btn-primary py-2" onClick={logout}>Cerrar sesión</button>
        </nav>
      </div>
    </header>
  );
}
