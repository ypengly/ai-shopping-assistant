import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PRODUCT_INCLUDE } from "@/lib/types";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const product = await db.product.findUnique({
    where: { slug: params.slug },
    include: PRODUCT_INCLUDE,
  });

  if (!product || product.status !== "ACTIVE") {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const user = await getCurrentUser();
  db.productView.create({ data: { userId: user?.id, productId: product.id } }).catch(() => {});

  return NextResponse.json({ product });
}
