import { db } from "@/lib/db";
import { PRODUCT_INCLUDE } from "@/lib/types";
import type { ProductFilters } from "@/lib/search";
import { searchProducts } from "@/lib/search";

/**
 * Non-AI recommendation modes. These are plain database queries — the "Best Match" /
 * "Best Value" / "Similar" / "Cheapest" modes from the spec are ranking strategies over
 * real rows, not something the model invents.
 */

export async function findCheapest(filters: ProductFilters, take = 6) {
  return searchProducts({ ...filters, sort: "price_asc", pageSize: take });
}

export async function findBestValue(filters: ProductFilters, take = 6) {
  // Best value = high rating relative to price. Fetch a candidate pool, then score in memory
  // (SQLite can't easily express rating/price in a portable ORDER BY).
  const pool = await searchProducts({ ...filters, sort: "rating", pageSize: 40 });
  const ranked = [...pool.items].sort((a, b) => b.rating / Math.max(b.price, 1) - a.rating / Math.max(a.price, 1));
  return { ...pool, items: ranked.slice(0, take) };
}

export async function findSimilarProducts(productId: string, take = 6) {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: { tags: true },
  });
  if (!product) return [];

  const tagNames = product.tags.map((t) => t.tag);

  const candidates = await db.product.findMany({
    where: {
      id: { not: productId },
      status: "ACTIVE",
      categoryId: product.categoryId,
      price: { gte: product.price * 0.5, lte: product.price * 1.5 },
    },
    include: PRODUCT_INCLUDE,
    take: 20,
  });

  // Score by shared tags, then proximity in price, so "similar" reflects the catalog, not a guess.
  const scored = candidates
    .map((c) => {
      const shared = c.tags.filter((t) => tagNames.includes(t.tag)).length;
      const priceDelta = Math.abs(c.price - product.price);
      return { product: c, score: shared * 100 - priceDelta };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, take)
    .map((s) => s.product);

  return scored;
}

export async function findCheaperAlternatives(productId: string, take = 6) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return [];
  return db.product.findMany({
    where: {
      id: { not: productId },
      status: "ACTIVE",
      categoryId: product.categoryId,
      price: { lt: product.price },
      stock: { gt: 0 },
    },
    include: PRODUCT_INCLUDE,
    orderBy: { price: "desc" }, // closest cheaper option first
    take,
  });
}

export async function findUpgrade(productId: string, take = 6) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return [];
  return db.product.findMany({
    where: {
      id: { not: productId },
      status: "ACTIVE",
      categoryId: product.categoryId,
      OR: [{ rating: { gt: product.rating } }, { price: { gt: product.price } }],
      stock: { gt: 0 },
    },
    include: PRODUCT_INCLUDE,
    orderBy: [{ rating: "desc" }, { price: "asc" }],
    take,
  });
}

/** Blends a signed-in customer's saved preferences into a filter set. */
export async function applyUserPreferences(userId: string | null, filters: ProductFilters): Promise<ProductFilters> {
  if (!userId) return filters;
  const pref = await db.shoppingPreference.findUnique({ where: { userId } });
  if (!pref) return filters;

  const merged: ProductFilters = { ...filters };
  if (merged.minPrice == null && pref.budgetMin != null) merged.minPrice = pref.budgetMin;
  if (merged.maxPrice == null && pref.budgetMax != null) merged.maxPrice = pref.budgetMax;

  try {
    const saved = JSON.parse(pref.preferences || "{}") as { brands?: string[] };
    if (!merged.brandIds?.length && saved.brands?.length) {
      const brands = await db.brand.findMany({ where: { name: { in: saved.brands } }, select: { id: true } });
      if (brands.length) merged.brandIds = brands.map((b) => b.id);
    }
  } catch {
    // malformed stored JSON — ignore rather than fail the request
  }

  return merged;
}

export async function recordRecommendations(
  userId: string,
  conversationId: string | null,
  items: { productId: string; reason: string }[],
) {
  if (!items.length) return;
  await db.recommendation.createMany({
    data: items.map((i) => ({ userId, conversationId, productId: i.productId, reason: i.reason })),
  });
}
