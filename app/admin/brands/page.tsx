import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { BrandManager } from "@/components/admin/brand-manager";

export const metadata: Metadata = { title: "Manage brands" };
export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  await requireAdmin();
  return (
    <div className="container py-8">
      <AdminNav active="/admin/brands" />
      <h1 className="mb-6 text-2xl font-semibold">Brands</h1>
      <BrandManager />
    </div>
  );
}
