"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Motorcycle } from "@/lib/motorcycles";

const empty = {
  code: "", description: "", brand: "", chassisNumber: "",
  observations: "", invoiceNumber: "", idPdfUrl: "", licenseNumber: ""
};

export function MotorcycleForm({ motorcycle, onSaved, onCancel }: {
  motorcycle?: Motorcycle;
  onSaved?: (motorcycle: Motorcycle) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState(() => ({
    code: motorcycle?.code ?? "",
    description: motorcycle?.description ?? "",
    brand: motorcycle?.brand ?? "",
    chassisNumber: motorcycle?.chassisNumber ?? "",
    observations: motorcycle?.observations ?? "",
    invoiceNumber: motorcycle?.invoiceNumber ?? "",
    idPdfUrl: motorcycle?.idPdfUrl ?? "",
    licenseNumber: motorcycle?.licenseNumber ?? ""
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Motorcycle | null>(null);
  const submitting = useRef(false);

  function set(name: keyof typeof empty, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit() {
    if (submitting.current) return;
    setError("");
    if ([form.code, form.description, form.brand, form.chassisNumber].some((value) => !value.trim())) {
      setError("Complete el código, la descripción, la marca y el número de chasis.");
      return;
    }
    if (!window.confirm(motorcycle ? "¿Guardar los cambios de esta moto? El estado no se modificará." : "¿Registrar esta moto como DISPONIBLE?")) return;
    submitting.current = true;
    setLoading(true);
    try {
      const payload = motorcycle
        ? { ...form, revision: motorcycle.revision }
        : { code: form.code, description: form.description, brand: form.brand, chassisNumber: form.chassisNumber };
      const response = await fetch(motorcycle ? `/api/motos/${encodeURIComponent(motorcycle.id)}` : "/api/motos", {
        method: motorcycle ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar la moto.");
      if (!data.motorcycle) throw new Error("El servidor no devolvió la moto guardada. Consulte el listado antes de intentar de nuevo.");
      if (motorcycle) onSaved?.(data.motorcycle);
      else setCreated(data.motorcycle);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la moto. Intente de nuevo.");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  if (created) return (
    <section className="card p-6" role="status">
      <h3 className="text-2xl font-black text-green-700">Moto registrada correctamente.</h3>
      <p className="mt-3">Código: <b>{created.code}</b>. Estado inicial: DISPONIBLE.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link className="btn-primary" href={`/admin/motos/${encodeURIComponent(created.id)}`}>Ver moto</Link>
        <button type="button" className="btn-green" onClick={() => { setCreated(null); setForm({ ...empty }); setError(""); }}>Registrar otra moto</button>
        <Link className="btn-secondary" href="/admin/motos">Volver al listado</Link>
      </div>
    </section>
  );

  return (
    <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void submit(); }} aria-busy={loading}>
      {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{error}</p>}
      <fieldset disabled={loading} className="card min-w-0 p-5">
        <h3 className="mb-2 text-lg font-black">{motorcycle ? "Editar datos de la moto" : "Datos de la moto"}</h3>
        <p className="mb-5 text-sm text-slate-500">{motorcycle ? "El cambio de estado se realiza en un formulario separado." : "Los cuatro campos son obligatorios. La fecha de recepción se registra automáticamente y el estado inicial es DISPONIBLE."}</p>
        <div className="grid gap-4 md:grid-cols-2">
          {([
            ["code", "Código"], ["description", "Descripción"],
            ["brand", "Marca"], ["chassisNumber", "Número de chasis"]
          ] as const).map(([name, label]) => (
            <label key={name}><span className="label">{label} *</span><input className="field" name={name} value={form[name]} required onChange={(event) => set(name, event.target.value)} /></label>
          ))}
          {motorcycle && <>
            <label><span className="label">Número de factura</span><input className="field" name="invoiceNumber" value={form.invoiceNumber} onChange={(event) => set("invoiceNumber", event.target.value)} /></label>
            <label><span className="label">Número de matrícula</span><input className="field" name="licenseNumber" value={form.licenseNumber} onChange={(event) => set("licenseNumber", event.target.value)} /></label>
            <label className="md:col-span-2">
              <span className="label">Enlace del documento de cédula (ambos lados)</span>
              <input className="field" name="idPdfUrl" type="url" pattern="https://.+" maxLength={2000} value={form.idPdfUrl} onChange={(event) => set("idPdfUrl", event.target.value)} aria-describedby="edit-pdf-hint" />
              <span id="edit-pdf-hint" className="mt-2 block text-sm text-slate-500">Pegue un enlace HTTPS de Drive u otro servicio. Se acepta cualquier formato. Solo se guarda el enlace (máximo 2000 caracteres), no el archivo ni su tamaño. Compruebe que el personal autorizado pueda abrirlo y mantenga los datos privados.</span>
            </label>
            <label className="md:col-span-2"><span className="label">Observaciones</span><textarea className="field min-h-28" name="observations" value={form.observations} onChange={(event) => set("observations", event.target.value)} /></label>
          </>}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <button disabled={loading} className="btn-primary">{loading ? "Guardando..." : motorcycle ? "Guardar cambios" : "Registrar moto"}</button>
        {onCancel && <button type="button" className="btn-secondary" disabled={loading} onClick={onCancel}>Cancelar edición</button>}
      </div>
    </form>
  );
}
