import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { badOrigin, isSameOrigin } from "@/lib/http";

const schema = z.object({
  categories: z.array(z.string()).max(20).default([]),
  brands: z.array(z.string()).max(20).default([]),
  colors: z.array(z.string()).max(20).default([]),
  sizes: z.array(z.string()).max(20).default([]),
  budgetMin: z.number().min(0).max(100000).nullable().optional(),
  budgetMax: z.number().min(0).max(100000).nullable().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to view preferences." }, { status: 401 });

  const pref = await db.shoppingPreference.findUnique({ where: { userId: user.id } });
  return NextResponse.json({
    preferences: pref ? JSON.parse(pref.preferences) : { categories: [], brands: [], colors: [], sizes: [] },
    budgetMin: pref?.budgetMin ?? null,
    budgetMax: pref?.budgetMax ?? null,
  });
}

export async function PUT(req: Request) {
  if (!isSameOrigin(req)) return badOrigin();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to save preferences." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid preferences." }, { status: 400 });

  const { budgetMin, budgetMax, ...rest } = parsed.data;
  await db.shoppingPreference.upsert({
    where: { userId: user.id },
    update: { preferences: JSON.stringify(rest), budgetMin, budgetMax },
    create: { userId: user.id, preferences: JSON.stringify(rest), budgetMin, budgetMax },
  });
  return NextResponse.json({ ok: true });
}
