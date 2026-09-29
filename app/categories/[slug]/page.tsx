import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getFilterOptions, searchProducts } from "@/lib/search";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductFilters as FilterSidebar } from "@/components/products/product-filters";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = await db.category.findUnique({ where: { slug: params.slug } });
  return { title: category?.name ?? "Category" };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await db.category.findUnique({ where: { slug: params.slug } });
  if (!category) notFound();

  const [{ items, total }, options, user] = await Promise.all([
    searchProducts({ categorySlug: params.slug, pageSize: 24 }),
    getFilterOptions(),
    getCurrentUser(),
  ]);
  const wishlistIds = user
    ? (await db.wishlist.findMany({ where: { userId: user.id }, select: { productId: true } })).map((w) => w.productId)
    : [];

  return (
    <div className="container grid gap-6 py-8 lg:grid-cols-[240px_1fr]">
      <aside>
        <FilterSidebar categories={options.categories} brands={options.brands} minPrice={options.minPrice} maxPrice={options.maxPrice} />
      </aside>
      <div>
        <h1 className="mb-1 text-2xl font-semibold">{category.name}</h1>
        <p className="mb-4 text-sm text-muted-foreground">{total} product{total === 1 ? "" : "s"}</p>
        <ProductGrid products={items} wishlistIds={wishlistIds} />
      </div>
    </div>
  );
}
