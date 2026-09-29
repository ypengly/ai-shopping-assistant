"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";

const KEY = "aisle-compare-slugs";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  rating: number;
  reviewCount: number;
  stock: number;
  brand: { name: string } | null;
  images: { url: string; alt: string }[];
  specs: { key: string; value: string }[];
};

export default function ComparePage() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setSlugs(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
    } catch {
      setSlugs([]);
    }
  }, []);

  useEffect(() => {
    if (!slugs.length) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(
      slugs.map((slug) =>
        fetch(`/api/products/${slug}`)
          .then((r) => r.json())
          .then((d) => d.product as Product)
          .catch(() => null),
      ),
    ).then((results) => {
      setProducts(results.filter((p): p is Product => Boolean(p)));
      setLoading(false);
    });
  }, [slugs]);

  function remove(slug: string) {
    const next = slugs.filter((s) => s !== slug);
    localStorage.setItem(KEY, JSON.stringify(next));
    setSlugs(next);
    setAnalysis(null);
  }

  async function runAiComparison() {
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);
    try {
      const response = await fetch("/api/ai/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: products.map((p) => p.id) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Something went wrong.");
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setAnalyzing(false);
    }
  }

  const allSpecKeys = Array.from(new Set(products.flatMap((p) => p.specs.map((s) => s.key))));

  return (
    <div className="container py-8">
      <h1 className="mb-1 text-2xl font-semibold">Compare products</h1>
      <p className="mb-6 text-sm text-muted-foreground">Add up to 4 products from any product page to compare them here.</p>

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : products.length < 2 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Add at least 2 products to compare. <Link href="/shop" className="text-primary underline-offset-4 hover:underline">Browse the shop</Link>.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">&nbsp;</th>
                  {products.map((p) => (
                    <th key={p.id} className="p-3 text-left align-top">
                      <button onClick={() => remove(p.slug)} className="float-right text-muted-foreground hover:text-foreground" aria-label={`Remove ${p.name}`}>
                        <X className="h-4 w-4" />
                      </button>
                      <div className="aspect-square w-20 overflow-hidden rounded-md border bg-muted">
                        {p.images[0] && <img src={p.images[0].url} alt={p.images[0].alt} className="h-full w-full object-cover" />}
                      </div>
                      <Link href={`/products/${p.slug}`} className="mt-2 block font-medium hover:underline">{p.name}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 font-medium text-muted-foreground">Price</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3 font-semibold">${p.price.toFixed(2)}</td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium text-muted-foreground">Rating</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3"><StarRating rating={p.rating} reviewCount={p.reviewCount} /></td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium text-muted-foreground">Availability</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3">{p.stock > 0 ? `In stock (${p.stock})` : "Out of stock"}</td>
                  ))}
                </tr>
                {allSpecKeys.map((key) => (
                  <tr key={key} className="border-b">
                    <td className="p-3 font-medium text-muted-foreground">{key}</td>
                    {products.map((p) => (
                      <td key={p.id} className="p-3">{p.specs.find((s) => s.key === key)?.value ?? "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <Button onClick={runAiComparison} disabled={analyzing} className="gap-2">
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              AI comparison
            </Button>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            {analysis && <p className="mt-4 rounded-md bg-accent p-4 text-sm text-accent-foreground">{analysis}</p>}
          </div>
        </>
      )}
    </div>
  );
}
