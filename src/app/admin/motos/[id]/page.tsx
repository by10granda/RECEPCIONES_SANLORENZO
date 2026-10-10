"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MotoBadge } from "@/components/MotoBadge";
import { MotorcycleForm } from "@/components/MotorcycleForm";
import { MOTORCYCLE_STATUSES, type Motorcycle, type MotorcycleHistory, type MotorcycleStatus } from "@/lib/motorcycles";

export default function MotorcycleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [motorcycle, setMotorcycle] = useState<Motorcycle | null>(null);
  const [history, setHistory] = useState<MotorcycleHistory[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reload, setReload] = useState(0);
  const [transition, setTransition] = useState({ status: "" as MotorcycleStatus | "", invoiceNumber: "", observations: "", idPdfUrl: "", licenseNumber: "" });
  const submitting = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/motos/${encodeURIComponent(id)}`, { signal: controller.signal, cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No se pudo cargar la moto.");
        if (!data.motorcycle || !Array.isArray(data.history)) throw new Error("El servidor devolvió un detalle inválido.");
        if (controller.signal.aborted) return;
        const moto: Motorcycle = data.motorcycle;
        setMotorcycle(moto);
        setHistory(data.history);
        setTransition({ status: moto.status, invoiceNumber: moto.invoiceNumber || "", observations: moto.observations || "", idPdfUrl: moto.idPdfUrl || "", licenseNumber: moto.licenseNumber || "" });
        setError("");
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "No se pudo cargar la moto.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [id, reload]);

  function refresh() {
    setLoading(true);
    setError("");
    setReload((value) => value + 1);
  }

  async function changeStatus() {
    if (!motorcycle || loading || saving || submitting.current || !transition.status || transition.status === motorcycle.status) return;
    setError("");
    setMessage("");
    if (motorcycle.status === "DISPONIBLE" && transition.status === "MATRICULA ENTREGADA") {
      setError("Primero registre la venta con matrícula en proceso antes de entregar la matrícula.");
      return;
    }
    if (transition.status === "VENDIDA CON MATRICULA EN PROCESO" && [transition.invoiceNumber, transition.observations, transition.idPdfUrl].some((value) => !value.trim())) {
      setError("Para registrar la venta, complete la factura, las observaciones y la URL del PDF.");
      return;
    }
    if (transition.status === "MATRICULA ENTREGADA" && !transition.licenseNumber.trim()) {
      setError("Para entregar la matrícula, complete su número.");
      return;
    }
    if (!window.confirm(`¿Cambiar el estado de ${motorcycle.code} de ${motorcycle.status} a ${transition.status}? Puede revertirlo y los datos existentes se conservarán.`)) return;
    submitting.current = true;
    setSaving(true);
    try {
      const response = await fetch(`/api/motos/${encodeURIComponent(motorcycle.id)}/estado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...transition, revision: motorcycle.revision })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo cambiar el estado.");
      setMessage("Estado actualizado correctamente.");
      refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cambiar el estado. Intente de nuevo.");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  const currentMotorcycle = motorcycle?.id === id ? motorcycle : null;
  if (!currentMotorcycle) return (
    <div className="space-y-4">
      <Link className="btn-secondary inline-block" href="/admin/motos">Volver al listado</Link>
      {error ? <div role="alert" className="rounded-2xl bg-red-50 p-4 text-red-700"><p>{error}</p><button className="btn-secondary mt-3" disabled={loading} onClick={refresh}>Reintentar</button></div> : <p role="status">Cargando moto...</p>}
    </div>
  );

  const moto = currentMotorcycle;
  const sale = transition.status === "VENDIDA CON MATRICULA EN PROCESO";
  const delivered = transition.status === "MATRICULA ENTREGADA";
  const blockedTransition = moto.status === "DISPONIBLE" && delivered;
  let pdfUrl: string | null = null;
  try {
    const url = new URL(moto.idPdfUrl);
    if (url.protocol === "https:" && !url.username && !url.password) pdfUrl = url.href;
  } catch { /* Invalid stored URLs are never rendered as links. */ }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><h2 className="break-words text-3xl font-black">{moto.code}</h2><p className="text-slate-500">Detalle de moto</p></div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Link className="btn-secondary" href="/admin/motos">Volver al listado</Link>
          <button className="btn-secondary" disabled={loading || saving || editing} onClick={() => { setEditing(true); setMessage(""); setError(""); }}>Editar datos</button>
          <button className="btn-secondary" disabled={loading || saving || editing} onClick={refresh}>Actualizar</button>
          <button className="btn-secondary" onClick={() => window.print()}>Imprimir</button>
        </div>
      </div>
      {message && <p role="status" className="rounded-2xl border border-green-200 bg-green-50 p-4 font-semibold text-green-700">{message}</p>}
      {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"><p className="font-semibold">{error}</p><button className="btn-secondary mt-3" disabled={loading || saving || editing} onClick={refresh}>Recargar datos</button><p className="mt-2 text-sm">Si otra persona modificó la moto, recargue sus datos antes de volver a guardar.</p></div>}
      {loading && <p role="status">Actualizando datos e historial...</p>}
      <section className="card p-5"><p className="mb-2 text-sm text-slate-500">Estado actual</p><MotoBadge status={moto.status} /><p className="mt-2 text-sm text-slate-500">Último cambio de estado: {moto.stateChangedAt || "-"}</p></section>
      {editing && <div className="print:hidden"><MotorcycleForm key={`${moto.id}:${moto.revision}`} motorcycle={moto} onCancel={() => setEditing(false)} onSaved={(saved) => { setMotorcycle(saved); setEditing(false); setMessage("Datos actualizados correctamente."); refresh(); }} /></div>}
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <section className="card min-w-0 p-5 lg:col-span-2">
          <h3 className="mb-4 text-xl font-black">Datos de la moto</h3>
          <dl className="grid gap-3 md:grid-cols-2">
            {[
              ["Código", moto.code], ["Descripción", moto.description], ["Marca", moto.brand], ["Número de chasis", moto.chassisNumber],
              ["Recepción", moto.receivedAt], ["Factura", moto.invoiceNumber], ["Matrícula", moto.licenseNumber], ["Sucursal", moto.branch],
              ["Registrada por", moto.createdBy], ["Última actualización", moto.updatedAt], ["Actualizada por", moto.updatedBy], ["Observaciones", moto.observations]
            ].map(([label, value]) => <div className="min-w-0 rounded-2xl bg-slate-50 p-3" key={label}><dt className="text-xs font-black uppercase text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words font-semibold">{value || "-"}</dd></div>)}
            <div className="min-w-0 rounded-2xl bg-slate-50 p-3 md:col-span-2">
              <dt className="text-xs font-black uppercase text-slate-500">PDF de cédula (ambos lados)</dt>
              <dd className="mt-1 break-all">{pdfUrl ? <a className="font-bold text-pasRed underline" href={pdfUrl} target="_blank" rel="noreferrer">{pdfUrl}</a> : moto.idPdfUrl ? "El enlace guardado no es una URL HTTPS válida. Corríjalo en Editar datos." : "Sin documento registrado."}</dd>
            </div>
          </dl>
        </section>
        <section className="card min-w-0 p-5">
          <h3 className="mb-4 text-xl font-black">Historial completo</h3>
          {!history.length ? <p className="text-sm text-slate-500">No hay movimientos registrados.</p> : <ol className="space-y-5">
            {history.map((item) => (
              <li key={item.id} className="border-l-2 border-slate-200 pl-4">
                <p className="text-sm font-black">{item.action === "REGISTRO" ? "Registro" : item.action === "EDICION" ? "Edición de datos" : "Cambio de estado"}</p>
                <p className="mt-1 text-xs text-slate-500">{item.timestamp} · {item.username}</p>
                <p className="mt-2 break-words text-sm">{item.previousStatus ? `${item.previousStatus} → ` : ""}{item.newStatus}</p>
                <HistoryDetails item={item} />
              </li>
            ))}
          </ol>}
        </section>
      </div>
      <form className="card space-y-4 p-5 print:hidden" onSubmit={(event) => { event.preventDefault(); void changeStatus(); }} aria-busy={saving}>
        <h3 className="text-xl font-black">Cambiar estado</h3>
        <p className="text-sm text-slate-500">Para pasar de DISPONIBLE a MATRÍCULA ENTREGADA, primero registre la venta con matrícula en proceso. Puede retroceder de estado conservando los datos guardados. Las fechas se registran automáticamente.</p>
        {editing && <p className="text-sm font-semibold text-amber-800">Guarde o cancele la edición antes de cambiar el estado.</p>}
        <fieldset disabled={loading || saving || editing} className="grid min-w-0 gap-4 md:grid-cols-2">
          <label className="md:col-span-2"><span className="label">Estado de destino</span><select className="field" value={transition.status} onChange={(event) => setTransition((current) => ({ ...current, status: event.target.value as MotorcycleStatus }))}>{MOTORCYCLE_STATUSES.map((status) => <option key={status} value={status} disabled={moto.status === "DISPONIBLE" && status === "MATRICULA ENTREGADA"}>{status}</option>)}</select></label>
          {sale && <>
            <label><span className="label">Número de factura *</span><input className="field" name="invoiceNumber" value={transition.invoiceNumber} required onChange={(event) => setTransition((current) => ({ ...current, invoiceNumber: event.target.value }))} /></label>
            <label className="md:col-span-2"><span className="label">Observaciones de la venta *</span><textarea className="field min-h-28" name="observations" value={transition.observations} required onChange={(event) => setTransition((current) => ({ ...current, observations: event.target.value }))} /></label>
            <label className="md:col-span-2">
              <span className="label">URL del PDF de cédula (ambos lados) *</span>
              <input className="field" name="idPdfUrl" type="url" pattern="https://.+" value={transition.idPdfUrl} required aria-describedby="status-pdf-hint" onChange={(event) => setTransition((current) => ({ ...current, idPdfUrl: event.target.value }))} />
              <span id="status-pdf-hint" className="mt-2 block text-sm text-slate-500">Use un enlace HTTPS. Para Google Drive, comparta el PDF con la cuenta de servicio y active Google Drive API en el proyecto de Google Cloud. Para enlaces externos, solo se verifica la extensión .pdf. No se suben archivos desde este formulario; mantenga los datos privados.</span>
            </label>
          </>}
          {delivered && <label><span className="label">Número de matrícula *</span><input className="field" name="licenseNumber" value={transition.licenseNumber} required onChange={(event) => setTransition((current) => ({ ...current, licenseNumber: event.target.value }))} /></label>}
        </fieldset>
        <button className="btn-green" disabled={loading || saving || editing || blockedTransition || transition.status === moto.status}>{saving ? "Cambiando estado..." : "Confirmar cambio de estado"}</button>
      </form>
    </div>
  );
}

function HistoryDetails({ item }: { item: MotorcycleHistory }) {
  if (item.action === "REGISTRO") return <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">{item.details || "Sin detalles adicionales."}</p>;

  const labels: Record<string, string> = {
    code: "Código", description: "Descripción", brand: "Marca", chassisNumber: "Número de chasis",
    observations: "Observaciones", receivedAt: "Recepción", invoiceNumber: "Número de factura",
    idPdfUrl: "URL del documento PDF", licenseNumber: "Número de matrícula", status: "Estado",
    branch: "Sucursal", createdBy: "Registrada por", updatedAt: "Última actualización",
    updatedBy: "Actualizada por", stateChangedAt: "Último cambio de estado", revision: "Revisión"
  };
  let changes: { field: string; before: string; after: string }[];
  try {
    const parsed: unknown = JSON.parse(item.details);
    if (!Array.isArray(parsed) || !parsed.every((change) => change && typeof change.field === "string" && typeof change.before === "string" && typeof change.after === "string")) {
      throw new Error("Invalid history details");
    }
    changes = parsed;
  } catch {
    return <p className="mt-2 text-sm text-slate-500">No se pudieron interpretar los detalles de este movimiento.</p>;
  }

  if (!changes.length) return <p className="mt-2 text-sm text-slate-500">Sin cambios de datos adicionales.</p>;
  return (
    <dl className="mt-3 space-y-3 text-sm">
      {changes.map((change, index) => (
        <div key={`${change.field}:${index}`} className="min-w-0 rounded-xl bg-slate-50 p-3">
          <dt className="font-bold">{labels[change.field] || "Otro campo"}</dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-slate-700"><span className="font-semibold">Anterior: </span>{change.before || "Sin valor"}</dd>
          <dd className="mt-1 whitespace-pre-wrap break-words text-slate-700"><span className="font-semibold">Nuevo: </span>{change.after || "Sin valor"}</dd>
        </div>
      ))}
    </dl>
  );
}
