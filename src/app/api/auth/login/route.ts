import { NextRequest } from "next/server";
import { createSession, SESSION_COOKIE, verifyAdminCredentials } from "@/lib/auth";
import { error, handleApiError, json } from "@/lib/api";
import { cleanText } from "@/lib/validators";
import { isBranch } from "@/lib/branches";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = cleanText(body.username);
    const password = String(body.password || "");
    const branch = body.branch ?? "SAN LORENZO";
    if (!isBranch(branch)) return error("Sucursal inválida", 422);
    if (!verifyAdminCredentials(username, password, branch)) return error("Credenciales inválidas para esta sucursal", 401);
    const token = await createSession(username, branch);
    const response = json({ ok: true, username, branch });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8,
      path: "/"
    });
    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
