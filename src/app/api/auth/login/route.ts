import { NextRequest } from "next/server";
import { createSession, SESSION_COOKIE, verifyAdminCredentials } from "@/lib/auth";
import { error, handleApiError, json } from "@/lib/api";
import { cleanText } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = cleanText(body.username);
    const password = String(body.password || "");
    if (!verifyAdminCredentials(username, password)) return error("Credenciales inválidas", 401);
    const token = await createSession(username);
    const response = json({ ok: true, username });
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
