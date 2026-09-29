import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { applyUserPreferences, findBestValue, findCheapest } from "@/lib/recommendations";
import type { ProductFilters } from "@/lib/search";

const schema = z.object({
  mode: z.enum(["cheapest", "best_value"]).default("best_value"),
  category: z.string().optional(),
  maxPrice: z.number().optional(),
  minRating: z.number().optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const user = await getCurrentUser();
  const filters: ProductFilters = {
    categorySlug: parsed.data.category,
    maxPrice: parsed.data.maxPrice,
    minRating: parsed.data.minRating,
    inStockOnly: true,
  };
  const withPrefs = await applyUserPreferences(user?.id ?? null, filters);

  const result = parsed.data.mode === "cheapest" ? await findCheapest(withPrefs) : await findBestValue(withPrefs);
  return NextResponse.json({ items: result.items });
}
