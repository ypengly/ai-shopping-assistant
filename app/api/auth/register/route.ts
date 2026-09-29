import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { badOrigin, getClientIp, isSameOrigin, tooManyRequests } from "@/lib/http";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return badOrigin();

  const limit = rateLimit(`register:${getClientIp(req)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;
  const emailTaken = {
    error: "An account with this email already exists.",
    fieldErrors: { email: ["Email already registered."] },
  };

  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return NextResponse.json(emailTaken, { status: 409 });
  }

  try {
    // Role is always CUSTOMER here; admins are created by the seed script only.
    const user = await db.user.create({
      data: { name, email, password: await hashPassword(password), role: "CUSTOMER" },
      select: { id: true, name: true, email: true, role: true },
    });
    await createSession(user);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(emailTaken, { status: 409 });
    }
    console.error("register failed", error);
    return NextResponse.json({ error: "Could not create the account. Try again." }, { status: 500 });
  }
}
