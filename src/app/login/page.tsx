"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    const data = await res.json(); setLoading(false);
    if (!res.ok) return setError(data.error || "No se pudo iniciar sesión");
    router.push("/admin");
  }
  return <><PublicHeader /><main className="mx-auto max-w-md px-4 py-12"><form onSubmit={submit} className="card p-7"><h2 className="text-2xl font-black">Inicio de sesión administrativo</h2><p className="mt-2 text-sm text-slate-500">Acceso exclusivo para trabajadores.</p>{error && <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}<label className="mt-6 block"><span className="label">Usuario</span><input className="field" value={username} onChange={(e) => setUsername(e.target.value)} required /></label><label className="mt-4 block"><span className="label">Contraseña</span><input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label><button className="btn-primary mt-6 w-full" disabled={loading}>{loading ? "Ingresando..." : "Iniciar sesión"}</button></form></main></>;
}
