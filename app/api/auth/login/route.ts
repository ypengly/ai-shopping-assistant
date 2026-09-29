import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, getDummyHash, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { badOrigin, getClientIp, isSameOrigin, tooManyRequests } from "@/lib/http";

const WINDOW = 15 * 60 * 1000;

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return badOrigin();

  const ip = getClientIp(req);
  const ipLimit = rateLimit(`login-ip:${ip}`, 30, WINDOW);
  if (!ipLimit.ok) return tooManyRequests(ipLimit.retryAfter);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;
  const accountKey = `login-account:${ip}:${email}`;
  const accountLimit = rateLimit(accountKey, 8, WINDOW);
  if (!accountLimit.ok) return tooManyRequests(accountLimit.retryAfter);

  const user = await db.user.findUnique({ where: { email } });
  // Always run a bcrypt comparison so response time doesn't reveal whether the email exists.
  const valid = await verifyPassword(password, user?.password ?? (await getDummyHash()));

  if (!user || !valid) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  resetRateLimit(accountKey);
  await createSession(user);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
