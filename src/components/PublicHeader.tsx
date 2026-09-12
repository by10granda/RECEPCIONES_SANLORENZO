import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-pasRed">Distribuidor Punto PAS</p>
          <h1 className="text-2xl font-black text-ink">Sistema de Garantías</h1>
        </div>
        <nav className="flex gap-2">
          <Link className="btn-secondary" href="/consultar">Consulta pública</Link>
          <Link className="btn-primary" href="/login">Trabajadores</Link>
        </nav>
      </div>
    </header>
  );
}
