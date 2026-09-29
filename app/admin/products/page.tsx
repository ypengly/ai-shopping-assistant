import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteProductButton } from "@/components/admin/delete-product-button";

export const metadata: Metadata = { title: "Manage products" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { brand: true, category: true },
    take: 200,
  });

  return (
    <div className="container py-8">
      <AdminNav active="/admin/products" />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products ({products.length})</h1>
        <Button asChild className="gap-2">
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" /> Add product
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Brand</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="max-w-[220px] truncate p-3 font-medium">{p.name}</td>
                <td className="p-3 text-muted-foreground">{p.category.name}</td>
                <td className="p-3 text-muted-foreground">{p.brand?.name ?? "—"}</td>
                <td className="p-3">${p.price.toFixed(2)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3">
                  <Badge variant={p.status === "ACTIVE" ? "success" : "outline"}>{p.status}</Badge>
                  {p.featured && <Badge variant="accent" className="ml-1">Featured</Badge>}
                </td>
                <td className="space-x-2 p-3 text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/products/${p.id}`}>Edit</Link>
                  </Button>
                  <DeleteProductButton id={p.id} name={p.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
