import Link from "next/link";
import { MotorcycleForm } from "@/components/MotorcycleForm";

export default function NewMotorcyclePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="text-3xl font-black">Registrar nueva moto</h2>
        <Link className="btn-secondary" href="/admin/motos">Volver al listado</Link>
      </div>
      <MotorcycleForm />
    </div>
  );
}
