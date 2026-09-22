"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { displayDateToInput } from "@/lib/time";
import type { Warranty } from "@/lib/types";

const empty = {
  customerName: "", customerLastName: "", documentType: "Cédula", documentNumber: "", phone: "", email: "",
  saleDate: "", receptionDate: "", invoiceNumber: "", productDescription: "", productCode: "", serialNumber: "",
  brand: "", reportedFailure: "", observations: "", sellerName: "", currentStatus: "PRODUCTO RECIBIDO EN EL ALMACEN"
};

export function WarrantyForm({ warranty }: { warranty?: Warranty }) {
  const router = useRouter();
  const [form, setForm] = useState({
    ...empty,
    ...warranty,
    saleDate: warranty ? displayDateToInput(warranty.saleDate) : "",
    receptionDate: warranty ? displayDateToInput(warranty.receptionDate) : ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [created, setCreated] = useState<Warranty | null>(null);

  function set(name: string, value: string) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function submit(confirmDuplicate = false) {
    if (warranty && !confirm("¿Está seguro de guardar los cambios realizados?")) return;
    setLoading(true); setMessage("");
    const res = await fetch(warranty ? `/api/garantias/${warranty.id}` : "/api/garantias", {
      method: warranty ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, confirmDuplicate })
    });
    const data = await res.json();
    setLoading(false);
    if (res.status === 409 && !confirmDuplicate) {
      if (confirm(`${data.error}\n¿Desea guardar de todas formas?`)) return submit(true);
      return;
    }
    if (!res.ok) { setMessage(data.error || "No se pudo guardar"); return; }
    if (warranty) router.push(`/admin/garantias/${warranty.id}`);
    else { setCreated(data.warranty); setMessage("Garantía registrada correctamente."); }
  }

  if (created) return (
    <div className="card p-6">
      <h2 className="text-2xl font-black text-green-700">Garantía registrada correctamente.</h2>
      <p className="mt-3 text-lg">Código de garantía: <b>{created.code}</b></p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn-primary" onClick={() => router.push(`/admin/garantias/${created.id}`)}>Ver garantía</button>
        <button className="btn-secondary" onClick={() => router.push(`/admin/garantias/${created.id}`)}>Descargar PDF</button>
        <button className="btn-green" onClick={() => { setCreated(null); setForm(empty); }}>Registrar otra garantía</button>
        <button className="btn-secondary" onClick={() => router.push("/admin")}>Volver al panel</button>
      </div>
    </div>
  );

  return (
    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      {message && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{message}</div>}
      <Section title="A. Datos del cliente">
        <Input label="Nombre" name="customerName" value={form.customerName} onChange={set} required />
        <Input label="Apellido" name="customerLastName" value={form.customerLastName} onChange={set} required />
        <Select label="Tipo de documento" name="documentType" value={form.documentType} onChange={set} options={["Cédula", "Pasaporte"]} />
        <Input label="Número de documento" name="documentNumber" value={form.documentNumber} onChange={set} required />
        <Input label="Teléfono celular" name="phone" value={form.phone} onChange={set} required />
        <Input label="Correo electrónico" type="email" name="email" value={form.email} onChange={set} />
      </Section>
      <Section title="B. Datos de la venta">
        <Input label="Fecha de venta del producto" type="date" name="saleDate" value={form.saleDate} onChange={set} required />
        <Input label="Número de factura" name="invoiceNumber" value={form.invoiceNumber} onChange={set} required />
        <Input label="Descripción del producto" name="productDescription" value={form.productDescription} onChange={set} required />
        <Input label="Código del producto" name="productCode" value={form.productCode} onChange={set} required />
        <Input label="Marca" name="brand" value={form.brand} onChange={set} />
        <Input label="Número de serie del producto" name="serialNumber" value={form.serialNumber} onChange={set} required emphasis />
      </Section>
      <Section title="C. Datos de recepción de garantía">
        <Input label="Fecha en la que el producto se deja en el almacén" type="date" name="receptionDate" value={form.receptionDate} onChange={set} required />
        <TextArea label="Problema o falla reportada por el cliente" name="reportedFailure" value={form.reportedFailure} onChange={set} required />
        <TextArea label="Observaciones adicionales" name="observations" value={form.observations} onChange={set} />
      </Section>
      <Section title="D. Datos del vendedor">
        <Input label="Nombre del vendedor" name="sellerName" value={form.sellerName} onChange={set} required />
        <Input label="Empresa" name="company" value="VARIEDADES PAS" onChange={() => {}} disabled />
      </Section>
      <button disabled={loading} className="btn-primary w-full sm:w-auto">{loading ? "Guardando..." : warranty ? "Guardar cambios" : "Registrar garantía"}</button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="card p-5"><h2 className="mb-5 text-lg font-black">{title}</h2><div className="grid gap-4 md:grid-cols-2">{children}</div></section>;
}

function Input({ label, name, value, onChange, type = "text", required, disabled, emphasis }: { label: string; name: string; value: string; onChange: (n: string, v: string) => void; type?: string; required?: boolean; disabled?: boolean; emphasis?: boolean }) {
  return <label><span className="label">{label}</span><input className={`field ${emphasis ? "border-pasRed font-black tracking-wide" : ""}`} name={name} value={value} type={type} required={required} disabled={disabled} onChange={(e) => onChange(name, e.target.value)} /></label>;
}

function Select({ label, name, value, onChange, options }: { label: string; name: string; value: string; onChange: (n: string, v: string) => void; options: string[] }) {
  return <label><span className="label">{label}</span><select className="field" value={value} onChange={(e) => onChange(name, e.target.value)}>{options.map((o) => <option key={o}>{o}</option>)}</select></label>;
}

function TextArea({ label, name, value, onChange, required }: { label: string; name: string; value: string; onChange: (n: string, v: string) => void; required?: boolean }) {
  return <label className="md:col-span-2"><span className="label">{label}</span><textarea className="field min-h-28" value={value} required={required} onChange={(e) => onChange(name, e.target.value)} /></label>;
}
