import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { discountPercent } from "@/lib/types";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice: number | null;
  rating: number;
  reviewCount: number;
  stock: number;
  brand: { name: string } | null;
  images: { url: string; alt: string }[];
};

export function ProductCard({
  product,
  inWishlist = false,
  aiPick = false,
  reason,
}: {
  product: ProductCardData;
  inWishlist?: boolean;
  aiPick?: boolean;
  reason?: string;
}) {
  const discount = discountPercent(product);
  const image = product.images[0];

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-muted">
        {image ? (
          // Seed images are external placeholders — plain <img> avoids next/image domain config.
          <img src={image.url} alt={image.alt} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
        )}
        {discount > 0 && (
          <Badge variant="destructive" className="absolute left-2 top-2">
            -{discount}%
          </Badge>
        )}
        {aiPick && (
          <Badge variant="accent" className="absolute right-2 top-2 gap-1">
            <Sparkles className="h-3 w-3" /> AI pick
          </Badge>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {product.brand && <span className="text-xs text-muted-foreground">{product.brand.name}</span>}
        <Link href={`/products/${product.slug}`} className="line-clamp-2 font-medium leading-snug hover:underline">
          {product.name}
        </Link>
        <StarRating rating={product.rating} reviewCount={product.reviewCount} />

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-lg font-semibold">${product.price.toFixed(2)}</span>
          {product.originalPrice && <span className="text-sm text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</span>}
        </div>

        {product.stock <= 0 && (
          <Badge variant="outline" className="w-fit text-muted-foreground">
            Out of stock
          </Badge>
        )}

        {reason && <p className="mt-1 text-xs text-muted-foreground">{reason}</p>}

        <div className="mt-auto flex items-center justify-between pt-3">
          <Link href={`/products/${product.slug}`} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            View details
          </Link>
          <WishlistButton productId={product.id} initialInWishlist={inWishlist} />
        </div>
      </div>
    </div>
  );
}
