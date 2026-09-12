import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema de Garantias - Distribuidor Punto PAS",
  description: "Gestion de garantias para Distribuidor Punto PAS San Lorenzo"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
