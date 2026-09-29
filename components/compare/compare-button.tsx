"use client";

import { useEffect, useState } from "react";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KEY = "aisle-compare-slugs";
const MAX = 4;

function readSlugs(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function CompareButton({ slug }: { slug: string }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => setSlugs(readSlugs()), []);

  function toggle() {
    let next = readSlugs();
    if (next.includes(slug)) {
      next = next.filter((s) => s !== slug);
    } else {
      if (next.length >= MAX) next = next.slice(1);
      next = [...next, slug];
    }
    localStorage.setItem(KEY, JSON.stringify(next));
    setSlugs(next);
  }

  const active = slugs.includes(slug);

  return (
    <Button type="button" variant="outline" size="sm" onClick={toggle} className={cn("gap-2", active && "border-primary text-primary")}>
      <Scale className="h-4 w-4" />
      {active ? "Added to compare" : "Compare"}
    </Button>
  );
}
