"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { WarrantyForm } from "@/components/WarrantyForm";
import type { Warranty } from "@/lib/types";

export default function EditWarrantyPage() {
  const params = useParams<{ id: string }>();
  const [w, setW] = useState<Warranty | null>(null); const [error, setError] = useState("");
  useEffect(() => { fetch(`/api/garantias/${params.id}`).then((r) => r.json().then((d) => ({ ok: r.ok, d }))).then(({ ok, d }) => ok ? setW(d.warranty) : setError(d.error)); }, [params.id]);
  if (error) return <div className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</div>;
  if (!w) return <p>Cargando...</p>;
  return <><h2 className="mb-6 text-3xl font-black">Editar garantía {w.code}</h2><WarrantyForm warranty={w} /></>;
}
