"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ProductGrid } from "@/components/products/product-grid";
import type { ProductCardData } from "@/components/products/product-card";

const PURPOSES = ["Gaming", "Programming", "Office", "School", "Everyday", "Running"];

export default function ProductFinderPage() {
  const [query, setQuery] = useState("");
  const [budgetMax, setBudgetMax] = useState("800");
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [brand, setBrand] = useState("");
  const [results, setResults] = useState<ProductCardData[] | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setBrands(d.brands ?? []))
      .catch(() => {});
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    const params = new URLSearchParams({
      q: [query, purpose].filter(Boolean).join(" "),
      maxPrice: budgetMax,
      sort: "rating",
      inStock: "1",
    });
    if (brand) params.set("brands", brand);

    try {
      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();
      setResults(data.items ?? []);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="mb-1 text-2xl font-semibold">AI Product Finder</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Prefer typing free-form? Try the <Link href="/ai-assistant" className="text-primary underline-offset-4 hover:underline">chat assistant</Link> instead.
      </p>

      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border p-5">
        <div>
          <label className="mb-1 block text-sm font-medium">What are you looking for?</label>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Laptop, running shoes, headphones…" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Budget (max, $)</label>
          <Input type="number" min={0} value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Main purpose</label>
          <div className="flex flex-wrap gap-2">
            {PURPOSES.map((p) => (
              <Button key={p} type="button" size="sm" variant={purpose === p ? "default" : "outline"} onClick={() => setPurpose(p)}>
                {p}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Preferred brand</label>
          <Select value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">Any brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </div>

        <Button type="submit" className="w-full gap-2" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Find Products
        </Button>
      </form>

      {results && (
        <div className="mt-8">
          <ProductGrid products={results} emptyMessage="No exact matches found. Try increasing the budget or removing the brand filter." />
        </div>
      )}
    </div>
  );
}
