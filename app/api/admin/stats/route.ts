import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth";

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) return response;

  const [totalProducts, totalCategories, totalCustomers, totalConversations, totalWishlistItems, mostViewed, mostRecommended, mostSearched] =
    await Promise.all([
      db.product.count(),
      db.category.count(),
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.conversation.count(),
      db.wishlist.count(),
      db.productView.groupBy({ by: ["productId"], _count: { productId: true }, orderBy: { _count: { productId: "desc" } }, take: 5 }),
      db.recommendation.groupBy({ by: ["productId"], _count: { productId: true }, orderBy: { _count: { productId: "desc" } }, take: 5 }),
      db.searchLog.groupBy({ by: ["query"], _count: { query: true }, orderBy: { _count: { query: "desc" } }, take: 5 }),
    ]);

  const productIds = Array.from(new Set([...mostViewed.map((v) => v.productId), ...mostRecommended.map((v) => v.productId)]));
  const products = await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, slug: true } });
  const byId = new Map(products.map((p) => [p.id, p]));

  return NextResponse.json({
    totals: {
      products: totalProducts,
      categories: totalCategories,
      customers: totalCustomers,
      conversations: totalConversations,
      wishlistItems: totalWishlistItems,
    },
    mostViewed: mostViewed.map((v) => ({ product: byId.get(v.productId), count: v._count.productId })),
    mostRecommended: mostRecommended.map((v) => ({ product: byId.get(v.productId), count: v._count.productId })),
    topSearches: mostSearched.map((s) => ({ query: s.query, count: s._count.query })),
  });
}
