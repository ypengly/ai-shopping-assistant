"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId, initialInWishlist }: { productId: string; initialInWishlist: boolean }) {
  const router = useRouter();
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [pending, startTransition] = useTransition();

  async function toggle() {
    const next = !inWishlist;
    setInWishlist(next); // optimistic

    try {
      const response = await fetch("/api/wishlist", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        setInWishlist(!next);
        return;
      }
      if (!response.ok) throw new Error("failed");
      startTransition(() => router.refresh());
    } catch {
      setInWishlist(!next); // revert on failure
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-pressed={inWishlist}
      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      onClick={toggle}
      disabled={pending}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn("h-4 w-4", inWishlist && "fill-destructive text-destructive")} />}
    </Button>
  );
}
