import bcrypt from "bcryptjs";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
  type SessionPayload,
} from "@/lib/session";

const BCRYPT_ROUNDS = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

let dummyHash: Promise<string> | null = null;
/** Compared against when an email doesn't exist, so login timing doesn't reveal which emails are registered. */
export function getDummyHash() {
  dummyHash ??= hashPassword("not-a-real-password");
  return dummyHash;
}

export async function createSession(user: { id: string; name: string; role: string }) {
  const role = user.role === "ADMIN" ? "ADMIN" : "CUSTOMER";
  const token = await signSession({ userId: user.id, name: user.name, role });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function destroySession() {
  cookies().delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  return verifySession(cookies().get(SESSION_COOKIE)?.value);
}

/** The signed-in user, read fresh from the database (so role changes and deletions take effect immediately). */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  return db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
});

export async function requireUser(returnTo = "/") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser("/admin/dashboard");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** For API routes: no redirects, just a user or a ready-to-return JSON response. */
export async function requireAdminApi(): Promise<{ user: CurrentUser; response: null } | { user: null; response: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) return { user: null, response: NextResponse.json({ error: "Sign in to continue." }, { status: 401 }) };
  if (user.role !== "ADMIN") return { user: null, response: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  return { user, response: null };
}
