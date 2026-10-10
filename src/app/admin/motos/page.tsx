"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MotoBadge } from "@/components/MotoBadge";
import { DeleteMotorcycleButton } from "@/components/DeleteMotorcycleButton";
import { MOTORCYCLE_STATUSES, type Motorcycle } from "@/lib/motorcycles";

export default function MotorcyclesPage() {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [brand, setBrand] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/motos", { signal: controller.signal, cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No se pudo cargar el listado de motos.");
        if (!Array.isArray(data.motorcycles)) throw new Error("El servidor devolvió un listado inválido.");
        if (!controller.signal.aborted) { setMotorcycles(data.motorcycles); setError(""); }
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "No se pudo cargar el listado de motos.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [reload]);

  const brands = [...new Set(motorcycles.map((moto) => moto.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
  const search = query.trim().toLocaleLowerCase("es");
  const filtered = motorcycles.filter((moto) => {
    const text = [moto.code, moto.description, moto.brand, moto.chassisNumber, moto.invoiceNumber, moto.licenseNumber, moto.branch].join(" ").toLocaleLowerCase("es");
    return (!search || text.includes(search)) && (!status || moto.status === status) && (!brand || moto.brand === brand);
  });
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, pages);
  const pageRows = filtered.slice((currentPage - 1) * size, currentPage * size);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><h2 className="text-3xl font-black">Motos</h2><p className="text-slate-500">Inventario, ventas y entrega de matrículas.</p></div>
        <div className="flex flex-wrap gap-2 print:hidden"><button className="btn-secondary" onClick={() => window.print()}>Imprimir</button><Link className="btn-green" href="/admin/motos/nueva">Nueva moto</Link></div>
      </div>
      <section className="card grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4 print:hidden" aria-label="Filtros de motos">
        <label className="md:col-span-2"><span className="label">Buscar</span><input className="field" type="search" placeholder="Código, descripción, chasis, factura, matrícula o sucursal" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>
        <label><span className="label">Estado</span><select className="field" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">Todos los estados</option>{MOTORCYCLE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label><span className="label">Marca</span><select className="field" value={brand} onChange={(event) => { setBrand(event.target.value); setPage(1); }}><option value="">Todas las marcas</option>{brands.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      </section>
      {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"><p className="font-semibold">{error}</p><button className="btn-secondary mt-3" disabled={loading} onClick={() => { setLoading(true); setError(""); setReload((value) => value + 1); }}>Reintentar</button></div>}
      {message && <p role="status" className="rounded-2xl border border-green-200 bg-green-50 p-4 font-semibold text-green-700">{message}</p>}
      {loading ? <p role="status">Cargando motos...</p> : !error && (
        <section className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <caption className="sr-only">Listado de motos</caption>
              <thead className="table-head"><tr>{["Código", "Descripción", "Marca", "Chasis", "Recepción", "Estado", "Sucursal", "Última actualización", "Acciones"].map((heading) => <th scope="col" className="table-cell" key={heading}>{heading}</th>)}</tr></thead>
              <tbody>{pageRows.map((moto) => (
                <tr key={moto.id}>
                  <td className="table-cell font-bold">{moto.code}</td><td className="table-cell">{moto.description}</td><td className="table-cell">{moto.brand}</td><td className="table-cell font-bold">{moto.chassisNumber}</td>
                  <td className="table-cell whitespace-nowrap">{moto.receivedAt || "-"}</td><td className="table-cell"><MotoBadge status={moto.status} /></td><td className="table-cell">{moto.branch || "-"}</td><td className="table-cell whitespace-nowrap">{moto.updatedAt || "-"}</td>
                  <td className="table-cell"><div className="flex flex-wrap items-center gap-3"><Link className="whitespace-nowrap font-bold text-pasRed" href={`/admin/motos/${encodeURIComponent(moto.id)}`}>Ver / Editar<span className="sr-only"> {moto.code}</span></Link><DeleteMotorcycleButton motorcycle={moto} disabled={loading} onDeleted={() => { setMotorcycles((current) => current.filter((entry) => entry.id !== moto.id)); setMessage(`Moto ${moto.code} e historial borrados correctamente.`); }} /></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {!filtered.length && <p className="p-6 text-center text-slate-500">No existen motos con esos criterios.</p>}
          <div className="flex flex-col items-center justify-between gap-3 border-t p-4 sm:flex-row">
            <p className="text-sm text-slate-500">{filtered.length} registros</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <label className="flex items-center gap-2 print:hidden"><span className="text-sm">Por página</span><select className="field w-auto py-2" value={size} onChange={(event) => { setSize(Number(event.target.value)); setPage(1); }}>{[10, 25, 50].map((quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}</select></label>
              <button className="btn-secondary print:hidden" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Anterior</button>
              <span className="text-sm" aria-live="polite">{currentPage} / {pages}</span>
              <button className="btn-secondary print:hidden" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Siguiente</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
