"use client";

import { useState } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Timeline } from "@/components/Timeline";
import { downloadPublicWarrantyPdf } from "@/lib/pdf";

type PublicWarranty = {
  id: string;
  code: string;
  customerName: string;
  documentNumber: string;
  invoiceNumber: string;
  productDescription: string;
  brand?: string;
  productCode: string;
  serialNumber: string;
  saleDate: string;
  receptionDate: string;
  currentStatus: string;
  lastUpdate: string;
  history: { date: string; time: string; newStatus: string }[];
};

export default function PublicSearchPage() {
  const [documentNumber, setDocumentNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [rows, setRows] = useState<PublicWarranty[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRows([]);
    const res = await fetch("/api/public/consultar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentNumber, invoiceNumber })
    });
    const data = await res.json();
    setLoading(false);
    setSearched(true);
    if (!res.ok) return setError(data.error || "No se pudo consultar");
    setRows(data.warranties || []);
  }

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="font-black uppercase tracking-widest text-pasRed">Portal público</p>
            <h2 className="mt-3 text-4xl font-black leading-tight md:text-5xl">Consulta el estado de tu garantía</h2>
            <p className="mt-4 text-lg text-slate-600">Ingresa tu número de cédula, pasaporte o número de factura para consultar el estado de tu producto.</p>
          </div>
          <form onSubmit={submit} className="card p-6">
            <label className="block"><span className="label">Número de cédula o pasaporte</span><input className="field" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} /></label>
            <div className="my-4 text-center text-sm font-bold text-slate-400">O</div>
            <label className="block"><span className="label">Número de factura</span><input className="field" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} /></label>
            {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
            <button className="btn-primary mt-6 w-full" disabled={loading}>{loading ? "Consultando..." : "CONSULTAR GARANTÍA"}</button>
          </form>
        </section>

        {searched && !rows.length && !loading && <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center font-semibold text-amber-800">No encontramos una garantía asociada con los datos ingresados. Verifique el número de documento o factura e intente nuevamente.</div>}

        <section className="mt-8 grid gap-6">
          {rows.map((w) => (
            <article className="card p-6" key={w.id}>
              <div className="flex flex-col justify-between gap-4 lg:flex-row">
                <div><p className="text-sm font-bold text-slate-500">Código de garantía</p><h3 className="text-2xl font-black">{w.code}</h3></div>
                <StatusBadge status={w.currentStatus} />
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  ["Cliente", w.customerName],
                  ["Factura", w.invoiceNumber],
                  ["Producto", w.productDescription],
                  ["Marca", w.brand || "-"],
                  ["Código del producto", w.productCode],
                  ["Número de serie", w.serialNumber],
                  ["Fecha de venta", w.saleDate],
                  ["Fecha de ingreso al almacén", w.receptionDate],
                  ["Última actualización", w.lastUpdate]
                ].map(([k, v]) => <div className="rounded-2xl bg-slate-50 p-3" key={k}><p className="text-xs font-black uppercase text-slate-500">{k}</p><p className="font-semibold">{v}</p></div>)}
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div><h4 className="mb-4 text-lg font-black">Línea de tiempo</h4><Timeline currentStatus={w.currentStatus} history={w.history} /></div>
                <div className="flex items-end justify-start"><button className="btn-green" onClick={() => downloadPublicWarrantyPdf(w)}>DESCARGAR ESTADO EN PDF</button></div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
