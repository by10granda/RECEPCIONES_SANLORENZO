"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminNav() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUsername(data.user?.username || ""))
      .catch(() => setUsername(""));
  }, []);

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
        <div className="flex flex-col gap-3 lg:items-end">
          {username && <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700">Usuario: {username}</div>}
          <nav className="flex flex-wrap gap-2">
            <Link className="btn-secondary py-2" href="/admin">Panel</Link>
            <Link className="btn-secondary py-2" href="/admin/garantias">Garantías</Link>
            <Link className="btn-green py-2" href="/admin/garantias/nueva">Nueva garantía</Link>
            <Link className="btn-secondary py-2" href="/admin/reportes">Reportes</Link>
            <button className="btn-primary py-2" onClick={logout}>Cerrar sesión</button>
          </nav>
        </div>
      </div>
    </header>
  );
}
