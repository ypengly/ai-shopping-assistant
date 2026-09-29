import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PRODUCT_INCLUDE, discountPercent } from "@/lib/types";
import { getContactSettings } from "@/lib/settings";
import { findSimilarProducts } from "@/lib/recommendations";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { CompareButton } from "@/components/compare/compare-button";
import { AskAiPanel } from "@/components/products/ask-ai-panel";
import { ContactSeller } from "@/components/products/contact-seller";
import { ProductGrid } from "@/components/products/product-grid";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await db.product.findUnique({ where: { slug: params.slug }, select: { name: true, shortDescription: true } });
  return { title: product?.name ?? "Product", description: product?.shortDescription };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await db.product.findUnique({ where: { slug: params.slug }, include: PRODUCT_INCLUDE });
  if (!product || product.status !== "ACTIVE") notFound();

  const [user, contact, similar] = await Promise.all([getCurrentUser(), getContactSettings(), findSimilarProducts(product.id)]);
  const inWishlist = user
    ? Boolean(await db.wishlist.findUnique({ where: { userId_productId: { userId: user.id, productId: product.id } } }))
    : false;

  const discount = discountPercent(product);
  const colors = Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean)));
  const sizes = Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean)));

  return (
    <div className="container py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
            {product.images[0] && <img src={product.images[0].url} alt={product.images[0].alt} className="h-full w-full object-cover" />}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1).map((img) => (
                <div key={img.url} className="aspect-square overflow-hidden rounded-md border bg-muted">
                  <img src={img.url} alt={img.alt} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            {product.brand && <Link href={`/shop?brands=${product.brand.id}`} className="text-sm text-muted-foreground hover:underline">{product.brand.name}</Link>}
            <h1 className="text-2xl font-semibold sm:text-3xl">{product.name}</h1>
            <StarRating rating={product.rating} reviewCount={product.reviewCount} className="mt-1" />
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold">${product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <>
                <span className="text-lg text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</span>
                <Badge variant="destructive">-{discount}%</Badge>
              </>
            )}
          </div>

          <p className="text-muted-foreground">{product.shortDescription}</p>

          {product.stock > 0 ? (
            <Badge variant="success" className="w-fit">In stock ({product.stock} available)</Badge>
          ) : (
            <Badge variant="outline" className="w-fit text-muted-foreground">Out of stock</Badge>
          )}

          {colors.length > 0 && (
            <div>
              <span className="mb-1 block text-sm font-medium">Colors</span>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <Badge key={c} variant="outline">{c}</Badge>
                ))}
              </div>
            </div>
          )}
          {sizes.length > 0 && (
            <div>
              <span className="mb-1 block text-sm font-medium">Sizes</span>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <Badge key={s} variant="outline">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <WishlistButton productId={product.id} initialInWishlist={inWishlist} />
            <CompareButton slug={product.slug} />
          </div>

          <ContactSeller channel={contact.channel} value={contact.value} instructions={contact.instructions} productName={product.name} />
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 text-lg font-semibold">Description</h2>
            <p className="whitespace-pre-line text-muted-foreground">{product.description}</p>
          </section>

          {product.specs.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-semibold">Specifications</h2>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-1 rounded-lg border p-4 sm:grid-cols-2">
                {product.specs.map((spec) => (
                  <div key={spec.key} className="flex justify-between border-b py-1.5 text-sm last:border-0 sm:justify-start sm:gap-2">
                    <dt className="text-muted-foreground">{spec.key}</dt>
                    <dd className="font-medium">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        <div>
          <AskAiPanel productId={product.id} />
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Similar products</h2>
          <ProductGrid products={similar} />
        </section>
      )}
    </div>
  );
}
