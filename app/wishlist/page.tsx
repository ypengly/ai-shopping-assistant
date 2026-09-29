import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PRODUCT_INCLUDE } from "@/lib/types";
import { ProductGrid } from "@/components/products/product-grid";

export const metadata: Metadata = { title: "Wishlist" };
export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await requireUser("/wishlist");
  const items = await db.wishlist.findMany({
    where: { userId: user.id },
    include: { product: { include: PRODUCT_INCLUDE } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container py-8">
      <h1 className="mb-1 text-2xl font-semibold">Your wishlist</h1>
      <p className="mb-6 text-sm text-muted-foreground">{items.length} saved item{items.length === 1 ? "" : "s"}</p>
      <ProductGrid
        products={items.map((i) => i.product)}
        wishlistIds={items.map((i) => i.productId)}
        emptyMessage="Nothing saved yet. Browse the shop or ask the AI assistant for ideas."
      />
    </div>
  );
}
