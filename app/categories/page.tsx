import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    include: { children: { orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } } },
  });

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-semibold">Categories</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((top) => (
          <Card key={top.id}>
            <CardHeader>
              <CardTitle>{top.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {top.children.map((child) => (
                <Link key={child.id} href={`/categories/${child.slug}`} className="flex justify-between rounded px-2 py-1.5 text-sm hover:bg-accent">
                  <span>{child.name}</span>
                  <span className="text-muted-foreground">{child._count.products}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
