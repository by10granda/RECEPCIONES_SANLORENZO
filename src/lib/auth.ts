import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import crypto from "crypto";
import { isBranch, type Branch } from "./branches";

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

export async function createSession(username: string, branch: Branch) {
  return new SignJWT({ username, branch })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}

export async function verifySession(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    // Existing sessions and accounts belong to San Lorenzo.
    const branch = payload.branch === undefined ? "SAN LORENZO" : payload.branch;
    if (typeof payload.username !== "string" || !isBranch(branch)) return null;
    const admin = configuredAdmins().find((entry) => entry.username === payload.username && (entry.branch || "SAN LORENZO") === branch);
    return admin ? { username: payload.username, branch } : null;
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
  branch?: Branch;
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
  if (process.env.ALMACEN_ADMIN_USERS_JSON) {
    try {
      const parsed = JSON.parse(process.env.ALMACEN_ADMIN_USERS_JSON) as AdminUser[];
      if (!Array.isArray(parsed)) throw new Error("Invalid accounts");
      admins.push(...parsed.filter((admin) => typeof admin.username === "string" && (admin.password || admin.passwordHash)).map((admin) => ({ ...admin, branch: "ALMACEN PAS" as const })));
    } catch {
      throw new Error("ALMACEN_ADMIN_USERS_JSON no tiene formato JSON válido");
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

export function verifyAdminCredentials(username: string, password: string, branch: Branch) {
  const admins = configuredAdmins();
  if (!admins.length) throw new Error("Configure ADMIN_PASSWORD, ADMIN_PASSWORD_HASH o ADMIN_USERS_JSON");
  return admins.some((admin) => (admin.branch || "SAN LORENZO") === branch && safeEqual(username, admin.username) && verifyPassword(admin, password));
}
