export type ProductWithRelations = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice: number | null;
  stock: number;
  rating: number;
  reviewCount: number;
  status: string;
  featured: boolean;
  brand: { id: string; name: string } | null;
  category: { id: string; name: string; slug: string };
  images: { url: string; alt: string }[];
  variants: { color: string | null; size: string | null; stock: number }[];
  tags: { tag: string }[];
  specs: { key: string; value: string }[];
};

export const PRODUCT_INCLUDE = {
  brand: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { order: "asc" as const } },
  variants: true,
  tags: true,
  specs: true,
};

export function discountPercent(product: { price: number; originalPrice: number | null }) {
  if (!product.originalPrice || product.originalPrice <= product.price) return 0;
  return Math.round(100 - (product.price / product.originalPrice) * 100);
}
