import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "pas_session";

function getSecret() {
  const value = process.env.SESSION_SECRET || "";
  return new TextEncoder().encode(value);
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const loginUrl = new URL("/login", request.url);
  if (!token || !process.env.SESSION_SECRET) return NextResponse.redirect(loginUrl);
  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/admin/:path*"]
};
