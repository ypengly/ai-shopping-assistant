import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Add product" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <div className="container py-8">
      <AdminNav active="/admin/products" />
      <h1 className="mb-6 text-2xl font-semibold">Add product</h1>
      <ProductForm />
    </div>
  );
}
