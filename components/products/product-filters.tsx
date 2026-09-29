"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; slug: string; parentId: string | null };
type Brand = { id: string; name: string };

export function ProductFilters({
  categories,
  brands,
  minPrice,
  maxPrice,
}: {
  categories: Category[];
  brands: Brand[];
  minPrice: number;
  maxPrice: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  const topCategories = categories.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);
  const selectedBrands = new Set((params.get("brands") ?? "").split(",").filter(Boolean));

  function toggleBrand(id: string) {
    const next = new Set(selectedBrands);
    next.has(id) ? next.delete(id) : next.add(id);
    update({ brands: next.size ? Array.from(next).join(",") : null });
  }

  return (
    <div>
      <Button variant="outline" className="mb-3 w-full justify-start gap-2 lg:hidden" onClick={() => setOpen((o) => !o)}>
        <SlidersHorizontal className="h-4 w-4" /> Filters
      </Button>

      <div className={cn("space-y-6 rounded-lg border p-4", !open && "hidden lg:block")}>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Category</h3>
          <div className="space-y-1 text-sm">
            <button
              className={cn("block w-full rounded px-2 py-1 text-left hover:bg-accent", !params.get("category") && "bg-accent font-medium")}
              onClick={() => update({ category: null })}
            >
              All categories
            </button>
            {topCategories.map((top) => (
              <div key={top.id}>
                <span className="block px-2 pt-2 text-xs font-semibold uppercase text-muted-foreground">{top.name}</span>
                {childrenOf(top.id).map((child) => (
                  <button
                    key={child.id}
                    className={cn(
                      "block w-full rounded px-2 py-1 text-left hover:bg-accent",
                      params.get("category") === child.slug && "bg-accent font-medium",
                    )}
                    onClick={() => update({ category: child.slug })}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Price</h3>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder={String(minPrice)}
              defaultValue={params.get("minPrice") ?? ""}
              onBlur={(e) => update({ minPrice: e.target.value || null })}
              className="h-9"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              placeholder={String(maxPrice)}
              defaultValue={params.get("maxPrice") ?? ""}
              onBlur={(e) => update({ maxPrice: e.target.value || null })}
              className="h-9"
            />
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Brand</h3>
          <div className="max-h-40 space-y-1 overflow-y-auto text-sm">
            {brands.map((brand) => (
              <label key={brand.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-accent">
                <input type="checkbox" checked={selectedBrands.has(brand.id)} onChange={() => toggleBrand(brand.id)} className="accent-primary" />
                {brand.name}
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Rating</h3>
          <Select defaultValue={params.get("minRating") ?? ""} onChange={(e) => update({ minRating: e.target.value || null })}>
            <option value="">Any rating</option>
            <option value="4">4+ stars</option>
            <option value="3">3+ stars</option>
          </Select>
        </div>

        <div className="space-y-2 text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={params.get("inStock") === "1"} onChange={(e) => update({ inStock: e.target.checked ? "1" : null })} className="accent-primary" />
            In stock only
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={params.get("onSale") === "1"} onChange={(e) => update({ onSale: e.target.checked ? "1" : null })} className="accent-primary" />
            On sale
          </label>
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={() => router.push(pathname)}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
