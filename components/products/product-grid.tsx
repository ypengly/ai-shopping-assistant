import { ProductCard, type ProductCardData } from "@/components/products/product-card";

export function ProductGrid({
  products,
  wishlistIds = [],
  emptyMessage = "No products match right now.",
}: {
  products: ProductCardData[];
  wishlistIds?: string[];
  emptyMessage?: string;
}) {
  if (!products.length) {
    return <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} inWishlist={wishlistIds.includes(product.id)} />
      ))}
    </div>
  );
}
