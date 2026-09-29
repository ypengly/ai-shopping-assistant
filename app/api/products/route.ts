import { NextResponse } from "next/server";
import { searchProducts, type ProductFilters } from "@/lib/search";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function parseFilters(url: URL): ProductFilters {
  const num = (key: string) => {
    const v = url.searchParams.get(key);
    return v != null && v !== "" ? Number(v) : undefined;
  };
  return {
    q: url.searchParams.get("q") ?? undefined,
    categorySlug: url.searchParams.get("category") ?? undefined,
    brandIds: url.searchParams.get("brands")?.split(",").filter(Boolean),
    color: url.searchParams.get("color") ?? undefined,
    size: url.searchParams.get("size") ?? undefined,
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    minRating: num("minRating"),
    onSaleOnly: url.searchParams.get("onSale") === "1",
    inStockOnly: url.searchParams.get("inStock") === "1",
    sort: (url.searchParams.get("sort") as ProductFilters["sort"]) ?? "relevance",
    page: num("page"),
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const filters = parseFilters(url);
  const result = await searchProducts(filters);

  // Log the search for recommendation-history / analytics use, without blocking the response.
  const user = await getCurrentUser();
  if (filters.q?.trim()) {
    db.searchLog
      .create({ data: { userId: user?.id, query: filters.q, resultCount: result.total } })
      .catch(() => {});
  }

  return NextResponse.json(result);
}
