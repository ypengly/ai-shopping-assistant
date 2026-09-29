"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function ProductSearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params.toString());
    q ? next.set("q", q) : next.delete("q");
    next.delete("page");
    router.push(`/shop?${next.toString()}`);
  }

  function onSortChange(sort: string) {
    const next = new URLSearchParams(params.toString());
    sort ? next.set("sort", sort) : next.delete("sort");
    router.push(`/shop?${next.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Try “comfortable shoes for walking” or “phone charger under $15”"
          className="pl-9"
        />
      </div>
      <Button type="submit">Search</Button>
      <Select defaultValue={params.get("sort") ?? "relevance"} onChange={(e) => onSortChange(e.target.value)} className="sm:w-48">
        <option value="relevance">Featured</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
        <option value="rating">Top rated</option>
        <option value="newest">Newest</option>
      </Select>
    </form>
  );
}
