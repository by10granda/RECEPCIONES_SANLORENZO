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

type AdminUser = {
  username: string;
  password?: string;
  passwordHash?: string;
};

function configuredAdmins() {
  const admins: AdminUser[] = [];
  const configuredUser = process.env.ADMIN_USERNAME || "administradorPas";
  const plainPassword = process.env.ADMIN_PASSWORD;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (plainPassword || passwordHash) admins.push({ username: configuredUser, password: plainPassword, passwordHash });
  if (process.env.ADMIN_USERS_JSON) {
    try {
      const parsed = JSON.parse(process.env.ADMIN_USERS_JSON) as AdminUser[];
      if (Array.isArray(parsed)) admins.push(...parsed.filter((admin) => admin.username && (admin.password || admin.passwordHash)));
    } catch {
      throw new Error("ADMIN_USERS_JSON no tiene formato JSON válido");
    }
  }
  return admins;
}

function verifyPassword(admin: AdminUser, password: string) {
  if (admin.passwordHash) {
    const hash = crypto.createHash("sha256").update(password).digest("hex");
    return safeEqual(hash, admin.passwordHash);
  }
  return Boolean(admin.password) && safeEqual(password, admin.password || "");
}

export function verifyAdminCredentials(username: string, password: string) {
  const admins = configuredAdmins();
  if (!admins.length) throw new Error("Configure ADMIN_PASSWORD, ADMIN_PASSWORD_HASH o ADMIN_USERS_JSON");
  return admins.some((admin) => safeEqual(username, admin.username) && verifyPassword(admin, password));
}
