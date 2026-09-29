import Link from "next/link";
import { Sparkles, ShoppingBag } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PRODUCT_INCLUDE } from "@/lib/types";
import { siteConfig } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/products/product-grid";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, featured] = await Promise.all([
    getCurrentUser(),
    db.product.findMany({ where: { status: "ACTIVE", featured: true }, include: PRODUCT_INCLUDE, take: 8 }),
  ]);

  const wishlistIds = user
    ? (await db.wishlist.findMany({ where: { userId: user.id }, select: { productId: true } })).map((w) => w.productId)
    : [];

  return (
    <>
      <section className="border-b bg-accent/40">
        <div className="container flex flex-col items-start gap-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Shop Smarter with AI</h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">{siteConfig.description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/ai-assistant">
                <Sparkles className="h-5 w-5" /> Ask AI
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link href="/shop">
                <ShoppingBag className="h-5 w-5" /> Browse Products
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container py-12">
          <h2 className="mb-4 text-xl font-semibold">Featured products</h2>
          <ProductGrid products={featured} wishlistIds={wishlistIds} />
        </section>
      )}
    </>
  );
}
