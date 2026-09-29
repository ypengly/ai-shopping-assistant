import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth";
import { productSchema } from "@/lib/admin-validation";
import { PRODUCT_INCLUDE } from "@/lib/types";
import { badOrigin, isSameOrigin } from "@/lib/http";

export async function GET(req: Request) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();

  const products = await db.product.findMany({
    where: q ? { name: { contains: q } } : undefined,
    include: PRODUCT_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return badOrigin();
  const { response } = await requireAdminApi();
  if (response) return response;

  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { images, tags, specs, variants, ...productData } = parsed.data;

  try {
    const product = await db.product.create({
      data: {
        ...productData,
        images: { create: images.map((img, order) => ({ ...img, order })) },
        tags: { create: tags.map((tag) => ({ tag })) },
        specs: { create: specs },
        variants: { create: variants },
      },
      include: PRODUCT_INCLUDE,
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A product with this slug already exists.", fieldErrors: { slug: ["Already in use."] } }, { status: 409 });
    }
    console.error("admin product create failed", error);
    return NextResponse.json({ error: "Could not create the product." }, { status: 500 });
  }
}
