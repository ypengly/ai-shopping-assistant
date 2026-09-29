// Edge-safe session helpers (used by middleware). Keep bcrypt/Prisma out of this file.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "aisle_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

export type Role = "CUSTOMER" | "ADMIN";
export type SessionPayload = { userId: string; role: Role; name: string };

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or shorter than 32 characters. See .env.example.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ role: payload.role, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_MAX_AGE)
    .sign(getSecret());
}

export async function verifySession(token: string | null | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const secret = getSecret(); // a misconfigured secret should fail loudly, not look like "logged out"
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const role = payload.role;
    if (!payload.sub || typeof payload.name !== "string" || (role !== "CUSTOMER" && role !== "ADMIN")) {
      return null;
    }
    return { userId: payload.sub, role, name: payload.name };
  } catch {
    return null;
  }
}
