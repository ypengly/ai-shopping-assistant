import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata: Metadata = { title: "Manage categories" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  return (
    <div className="container py-8">
      <AdminNav active="/admin/categories" />
      <h1 className="mb-6 text-2xl font-semibold">Categories</h1>
      <CategoryManager />
    </div>
  );
}
