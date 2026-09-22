"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Timeline } from "@/components/Timeline";
import { downloadAdminWarrantyPdf } from "@/lib/pdf";
import type { WarrantyWithHistory } from "@/lib/types";
import { WARRANTY_STATUSES } from "@/lib/types";

export default function WarrantyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [w, setW] = useState<WarrantyWithHistory | null>(null); const [newStatus, setNewStatus] = useState(""); const [error, setError] = useState("");
  const load = useCallback(async () => { const res = await fetch(`/api/garantias/${params.id}`); const data = await res.json(); if (res.ok) { setW(data.warranty); setNewStatus(data.warranty.currentStatus); } else setError(data.error); }, [params.id]);
  useEffect(() => { load(); }, [load]);
  async function changeStatus() {
    if (!w || !confirm("¿Está seguro de cambiar el estado de esta garantía?")) return;
    const res = await fetch(`/api/garantias/${w.id}/estado`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newStatus }) });
    const data = await res.json(); if (!res.ok) return setError(data.error || "No se pudo cambiar el estado"); await load();
  }
  async function deleteWarranty() {
    if (!w || !confirm(`¿Está seguro de eliminar por completo la garantía ${w.code}? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/garantias/${w.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "No se pudo eliminar la garantía");
    router.push("/admin/garantias");
  }
  if (error) return <div className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</div>;
  if (!w) return <p>Cargando...</p>;
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><h2 className="text-3xl font-black">{w.code}</h2><p className="text-slate-500">Garantía individual</p></div><div className="flex flex-wrap gap-2"><Link className="btn-secondary" href={`/admin/garantias/${w.id}/editar`}>Editar</Link><button className="btn-secondary" onClick={() => downloadAdminWarrantyPdf(w)}>Descargar PDF</button><button className="btn-secondary" onClick={() => window.print()}>Imprimir</button><button className="rounded-2xl bg-red-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-800" onClick={deleteWarranty}>Eliminar</button></div></div><section className="card p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-slate-500">Estado actual</p><StatusBadge status={w.currentStatus} /></div><div className="flex flex-col gap-2 sm:flex-row"><select className="field" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>{WARRANTY_STATUSES.map((s) => <option key={s}>{s}</option>)}</select><button className="btn-green" onClick={changeStatus}>Cambiar estado</button></div></div></section><div className="grid gap-6 lg:grid-cols-3"><section className="card p-5 lg:col-span-2"><h3 className="mb-4 text-xl font-black">Datos de garantía</h3><Grid rows={[["Cliente", `${w.customerName} ${w.customerLastName}`], ["Documento", `${w.documentType} ${w.documentNumber}`], ["Teléfono", w.phone], ["Correo", w.email], ["Factura", w.invoiceNumber], ["Producto", w.productDescription], ["Marca", w.brand], ["Código producto", w.productCode], ["Número serie", w.serialNumber], ["Fecha venta", w.saleDate], ["Ingreso almacén", w.receptionDate], ["Falla reportada", w.reportedFailure], ["Observaciones", w.observations], ["Vendedor", w.sellerName], ["Empresa", w.company], ["Creado", `${w.registeredDate} - ${w.registeredTime}`], ["Usuario creador", w.createdBy], ["Última actualización", w.lastUpdate]]} /></section><section className="card p-5"><h3 className="mb-4 text-xl font-black">Historial de estados</h3><Timeline currentStatus={w.currentStatus} history={w.history} /></section></div></div>;
}

function Grid({ rows }: { rows: string[][] }) { return <div className="grid gap-3 md:grid-cols-2">{rows.map(([k, v]) => <div className="rounded-2xl bg-slate-50 p-3" key={k}><p className="text-xs font-black uppercase text-slate-500">{k}</p><p className="mt-1 font-semibold">{v || "-"}</p></div>)}</div>; }
