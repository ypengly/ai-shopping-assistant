import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth";
import { productSchema } from "@/lib/admin-validation";
import { PRODUCT_INCLUDE } from "@/lib/types";
import { badOrigin, isSameOrigin } from "@/lib/http";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const product = await db.product.findUnique({ where: { id: params.id }, include: PRODUCT_INCLUDE });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return badOrigin();
  const { response } = await requireAdminApi();
  if (response) return response;

  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { images, tags, specs, variants, ...productData } = parsed.data;

  try {
    // Replace child rows atomically: full-record admin edits are infrequent, so simplicity wins over diffing.
    const product = await db.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: params.id } });
      await tx.productTag.deleteMany({ where: { productId: params.id } });
      await tx.productSpec.deleteMany({ where: { productId: params.id } });
      await tx.productVariant.deleteMany({ where: { productId: params.id } });

      return tx.product.update({
        where: { id: params.id },
        data: {
          ...productData,
          images: { create: images.map((img, order) => ({ ...img, order })) },
          tags: { create: tags.map((tag) => ({ tag })) },
          specs: { create: specs },
          variants: { create: variants },
        },
        include: PRODUCT_INCLUDE,
      });
    });
    return NextResponse.json({ product });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A product with this slug already exists.", fieldErrors: { slug: ["Already in use."] } }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    console.error("admin product update failed", error);
    return NextResponse.json({ error: "Could not update the product." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return badOrigin();
  const { response } = await requireAdminApi();
  if (response) return response;

  try {
    await db.product.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    console.error("admin product delete failed", error);
    return NextResponse.json({ error: "Could not delete the product." }, { status: 500 });
  }
}
