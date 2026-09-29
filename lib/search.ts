import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { PRODUCT_INCLUDE } from "@/lib/types";

/**
 * Structured shopping requirements. This is the ONLY shape the AI is allowed to produce
 * from a customer's message (see lib/ai.ts#extractRequirements) — it is never used to
 * build raw SQL, only to fill in the Prisma filter below.
 */
export type ShoppingRequirements = {
  category?: string | null;
  brand?: string | null;
  color?: string | null;
  size?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minRating?: number | null;
  purpose?: string | null;
  keywords?: string[];
  inStockOnly?: boolean;
};

export type ProductFilters = {
  q?: string;
  categorySlug?: string;
  brandIds?: string[];
  color?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  onSaleOnly?: boolean;
  inStockOnly?: boolean;
  sort?: "relevance" | "price_asc" | "price_desc" | "rating" | "newest";
  page?: number;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 12;

/** Builds a Prisma where-clause from filters. This is the only place that touches the query — the AI never sees SQL. */
function buildWhere(filters: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
  const and: Prisma.ProductWhereInput[] = [];

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    and.push({
      OR: [
        { name: { contains: q } },
        { description: { contains: q } },
        { shortDescription: { contains: q } },
        { tags: { some: { tag: { contains: q } } } },
        { brand: { name: { contains: q } } },
        { category: { name: { contains: q } } },
      ],
    });
  }

  if (filters.categorySlug) and.push({ category: { slug: filters.categorySlug } });
  if (filters.brandIds?.length) and.push({ brandId: { in: filters.brandIds } });
  if (filters.color) and.push({ variants: { some: { color: { contains: filters.color } } } });
  if (filters.size) and.push({ variants: { some: { size: { contains: filters.size } } } });
  if (filters.minPrice != null) and.push({ price: { gte: filters.minPrice } });
  if (filters.maxPrice != null) and.push({ price: { lte: filters.maxPrice } });
  if (filters.minRating != null) and.push({ rating: { gte: filters.minRating } });
  if (filters.onSaleOnly) and.push({ originalPrice: { not: null } });
  if (filters.inStockOnly) and.push({ stock: { gt: 0 } });

  if (and.length) where.AND = and;
  return where;
}

function buildOrderBy(sort: ProductFilters["sort"]): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    case "rating":
      return { rating: "desc" };
    case "newest":
      return { createdAt: "desc" };
    default:
      return { featured: "desc" };
  }
}

export async function searchProducts(filters: ProductFilters) {
  const pageSize = Math.min(filters.pageSize ?? DEFAULT_PAGE_SIZE, 48);
  const page = Math.max(filters.page ?? 1, 1);
  const where = buildWhere(filters);

  const [items, total] = await Promise.all([
    db.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy: buildOrderBy(filters.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where }),
  ]);

  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Turns AI-extracted requirements into product filters. Never invents a category/brand that isn't in the DB. */
export async function requirementsToFilters(req: ShoppingRequirements): Promise<ProductFilters> {
  const filters: ProductFilters = {
    minPrice: req.minPrice ?? undefined,
    maxPrice: req.maxPrice ?? undefined,
    minRating: req.minRating ?? undefined,
    inStockOnly: req.inStockOnly ?? true,
    color: req.color ?? undefined,
    size: req.size ?? undefined,
  };

  if (req.category) {
    const category = await db.category.findFirst({
      where: { name: { contains: req.category } },
      select: { slug: true },
    });
    if (category) filters.categorySlug = category.slug;
    else filters.q = [filters.q, req.category].filter(Boolean).join(" ");
  }

  if (req.brand) {
    const brand = await db.brand.findFirst({ where: { name: { contains: req.brand } }, select: { id: true } });
    if (brand) filters.brandIds = [brand.id];
  }

  const extra = [req.purpose, ...(req.keywords ?? [])].filter(Boolean).join(" ");
  if (extra) filters.q = [filters.q, extra].filter(Boolean).join(" ");

  return filters;
}

export async function getFilterOptions() {
  const [categories, brands, priceRange] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, parentId: true } }),
    db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.product.aggregate({ where: { status: "ACTIVE" }, _min: { price: true }, _max: { price: true } }),
  ]);
  return {
    categories,
    brands,
    minPrice: Math.floor(priceRange._min.price ?? 0),
    maxPrice: Math.ceil(priceRange._max.price ?? 1000),
  };
}
