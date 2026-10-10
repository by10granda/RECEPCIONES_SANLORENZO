"use client";

import { useEffect, useState } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import { BRANCHES, isBranch, type Branch } from "@/lib/branches";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [branch, setBranch] = useState<Branch>("SAN LORENZO");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("branch");
    if (isBranch(selected)) setBranch(selected);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password, branch }) });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "No se pudo iniciar sesión");
        setLoading(false);
        return;
      }
      window.location.assign("/admin");
    } catch {
      setError("No se pudo conectar con el servidor. Intenta nuevamente.");
      setLoading(false);
    }
  }
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <form onSubmit={submit} className="card p-7">
          <h2 className="text-2xl font-black">Inicio de sesión administrativo</h2>
          <p className="mt-2 text-sm text-slate-500">Acceso exclusivo para trabajadores.</p>
          {error && <div role="alert" className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
          <label className="mt-6 block">
            <span className="label">Sucursal</span>
            <select className="field" value={branch} disabled={loading} onChange={(e) => {
              if (isBranch(e.target.value)) setBranch(e.target.value);
            }}>
              {BRANCHES.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="mt-4 block">
            <span className="label">Usuario</span>
            <input className="field" value={username} disabled={loading} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label className="mt-4 block">
            <span className="label">Contraseña</span>
            <input className="field" type="password" value={password} disabled={loading} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button className="btn-primary mt-6 w-full" disabled={loading}>{loading ? "Ingresando..." : "Iniciar sesión"}</button>
        </form>
      </main>
    </>
  );
}
