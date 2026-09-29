import { NextResponse } from "next/server";

export function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

/** Rejects cross-site browser requests to state-changing routes (defense in depth on top of SameSite=Lax). */
export function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients (curl, server-to-server)
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export function badOrigin() {
  return NextResponse.json({ error: "Request blocked: invalid origin." }, { status: 403 });
}

export function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    { error: `Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).` },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
