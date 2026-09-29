import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PRODUCT_INCLUDE } from "@/lib/types";
import { badOrigin, isSameOrigin } from "@/lib/http";

const bodySchema = z.object({ productId: z.string().min(1) });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to view your wishlist." }, { status: 401 });

  const items = await db.wishlist.findMany({
    where: { userId: user.id },
    include: { product: { include: PRODUCT_INCLUDE } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items: items.map((i) => i.product) });
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return badOrigin();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to save items." }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "productId is required." }, { status: 400 });

  const product = await db.product.findUnique({ where: { id: parsed.data.productId }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  await db.wishlist.upsert({
    where: { userId_productId: { userId: user.id, productId: product.id } },
    update: {},
    create: { userId: user.id, productId: product.id },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isSameOrigin(req)) return badOrigin();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage your wishlist." }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "productId is required." }, { status: 400 });

  await db.wishlist.deleteMany({ where: { userId: user.id, productId: parsed.data.productId } });
  return NextResponse.json({ ok: true });
}
