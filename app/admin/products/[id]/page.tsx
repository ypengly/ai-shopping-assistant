import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminNav } from "@/components/admin/admin-nav";
import { ProductForm, type ProductFormValues } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Edit product" };
export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const product = await db.product.findUnique({
    where: { id: params.id },
    include: { images: { orderBy: { order: "asc" } }, specs: true, tags: true, variants: true },
  });
  if (!product) notFound();

  const initial: ProductFormValues = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    stock: product.stock,
    categoryId: product.categoryId,
    brandId: product.brandId,
    status: product.status as "ACTIVE" | "INACTIVE",
    featured: product.featured,
    images: product.images.map((i) => ({ url: i.url, alt: i.alt })),
    tags: product.tags.map((t) => t.tag),
    specs: product.specs.map((s) => ({ key: s.key, value: s.value })),
    variants: product.variants.map((v) => ({ color: v.color ?? "", size: v.size ?? "", stock: v.stock, sku: v.sku })),
  };

  return (
    <div className="container py-8">
      <AdminNav active="/admin/products" />
      <h1 className="mb-6 text-2xl font-semibold">Edit product</h1>
      <ProductForm initial={initial} />
    </div>
  );
}
