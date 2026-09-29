import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminNav } from "@/components/admin/admin-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [totalProducts, totalCategories, totalCustomers, totalConversations, totalWishlistItems, mostViewed, mostRecommended, topSearches] =
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
  const products = await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } });
  const nameById = new Map(products.map((p) => [p.id, p.name]));

  const stats = [
    { label: "Total products", value: totalProducts },
    { label: "Categories", value: totalCategories },
    { label: "Customers", value: totalCustomers },
    { label: "AI conversations", value: totalConversations },
    { label: "Wishlist items", value: totalWishlistItems },
  ];

  return (
    <div className="container py-8">
      <AdminNav active="/admin/dashboard" />
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-2xl font-semibold">{s.value.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <RankedList title="Most viewed products" rows={mostViewed.map((v) => ({ label: nameById.get(v.productId) ?? "Unknown", count: v._count.productId }))} />
        <RankedList title="Most recommended products" rows={mostRecommended.map((v) => ({ label: nameById.get(v.productId) ?? "Unknown", count: v._count.productId }))} />
        <RankedList title="Top searches" rows={topSearches.map((s) => ({ label: s.query, count: s._count.query }))} />
      </div>
    </div>
  );
}

function RankedList({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between text-sm">
              <span className="truncate pr-2">{r.label}</span>
              <span className="font-medium text-muted-foreground">{r.count}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
