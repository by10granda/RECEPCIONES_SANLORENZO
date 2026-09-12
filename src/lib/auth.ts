import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import crypto from "crypto";

export const SESSION_COOKIE = "pas_session";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET debe tener al menos 32 caracteres");
  return new TextEncoder().encode(value);
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export async function createSession(username: string) {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}

export async function verifySession(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.username === "string" ? { username: payload.username } : null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");
  return user;
}

export function verifyAdminCredentials(username: string, password: string) {
  const configuredUser = process.env.ADMIN_USERNAME || "administradorPas";
  const plainPassword = process.env.ADMIN_PASSWORD;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!safeEqual(username, configuredUser)) return false;
  if (passwordHash) {
    const hash = crypto.createHash("sha256").update(password).digest("hex");
    return safeEqual(hash, passwordHash);
  }
  if (!plainPassword) throw new Error("Configure ADMIN_PASSWORD o ADMIN_PASSWORD_HASH");
  return safeEqual(password, plainPassword);
}
