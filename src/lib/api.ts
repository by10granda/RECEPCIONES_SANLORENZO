import { NextResponse } from "next/server";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(err: unknown) {
  const message = err instanceof Error ? err.message : "Error inesperado";
  const status = message === "No autorizado" ? 401 : 500;
  return error(message, status);
}
