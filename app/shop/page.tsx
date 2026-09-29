import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFilterOptions, searchProducts, type ProductFilters } from "@/lib/search";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductFilters as FilterSidebar } from "@/components/products/product-filters";
import { ProductSearchBar } from "@/components/products/product-search-bar";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Shop" };
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | undefined>;

function parseFilters(sp: SearchParams): ProductFilters {
  const num = (v?: string) => (v ? Number(v) : undefined);
  return {
    q: sp.q,
    categorySlug: sp.category,
    brandIds: sp.brands?.split(",").filter(Boolean),
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    minRating: num(sp.minRating),
    onSaleOnly: sp.onSale === "1",
    inStockOnly: sp.inStock === "1",
    sort: (sp.sort as ProductFilters["sort"]) ?? "relevance",
    page: num(sp.page),
  };
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseFilters(searchParams);
  const [{ items, total, page, pageCount }, options, user] = await Promise.all([
    searchProducts(filters),
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
        <div className="mb-4 space-y-3">
          <h1 className="text-2xl font-semibold">Shop</h1>
          <ProductSearchBar />
          <p className="text-sm text-muted-foreground">{total} product{total === 1 ? "" : "s"} found</p>
        </div>

        <ProductGrid products={items} wishlistIds={wishlistIds} emptyMessage="No products match your filters. Try widening your budget or clearing a filter." />

        {pageCount > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <Button key={p} asChild variant={p === page ? "default" : "outline"} size="sm">
                <a href={`?${new URLSearchParams({ ...searchParams, page: String(p) } as Record<string, string>).toString()}`}>{p}</a>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
