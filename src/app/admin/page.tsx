"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Warranty } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

export default function AdminDashboard() {
  const [rows, setRows] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/garantias").then((r) => r.json()).then((d) => setRows(d.warranties || [])).finally(() => setLoading(false)); }, []);
  const today = new Date().toLocaleDateString("es-EC", { timeZone: "America/Guayaquil" });
  const month = today.slice(3);
  const stats = [
    ["TOTAL GARANTÍAS", rows.length],
    ["RECIBIDOS EN ALMACÉN", rows.filter((w) => w.currentStatus === "PRODUCTO RECIBIDO EN EL ALMACEN").length],
    ["ENVIADOS AL PROVEEDOR", rows.filter((w) => w.currentStatus === "PRODUCTO ENVIADO AL PROVEEDOR").length],
    ["LLEGADOS AL ALMACÉN", rows.filter((w) => w.currentStatus === "PRODUCTO LLEGADO AL ALMACEN").length],
    ["ENTREGADOS AL CLIENTE", rows.filter((w) => w.currentStatus === "PRODUCTO ENTREGADO AL CLIENTE").length],
    ["GARANTÍAS REGISTRADAS HOY", rows.filter((w) => w.registeredDate === today).length],
    ["GARANTÍAS REGISTRADAS ESTE MES", rows.filter((w) => w.registeredDate.endsWith(month)).length]
  ];
  return <div className="space-y-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="text-3xl font-black">Panel administrativo</h2><p className="text-slate-500">Resumen general de garantías.</p></div><Link className="btn-green" href="/admin/garantias/nueva">Registrar garantía</Link></div>{loading ? <p>Cargando...</p> : <><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{stats.map(([label, value]) => <div className="card p-5" key={label}><p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p><p className="mt-3 text-4xl font-black">{value}</p></div>)}</div><section className="card overflow-hidden"><div className="border-b p-5"><h3 className="text-xl font-black">Últimas garantías registradas</h3></div><div className="overflow-x-auto"><table className="w-full"><thead className="table-head"><tr><th className="table-cell">Código</th><th className="table-cell">Cliente</th><th className="table-cell">Producto</th><th className="table-cell">Estado</th><th className="table-cell">Acción</th></tr></thead><tbody>{rows.slice(-8).reverse().map((w) => <tr key={w.id}><td className="table-cell font-bold">{w.code}</td><td className="table-cell">{w.customerName} {w.customerLastName}</td><td className="table-cell">{w.productDescription}</td><td className="table-cell"><StatusBadge status={w.currentStatus} /></td><td className="table-cell"><Link className="font-bold text-pasRed" href={`/admin/garantias/${w.id}`}>Ver</Link></td></tr>)}</tbody></table></div></section></>}</div>;
}
