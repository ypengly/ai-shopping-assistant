import { NextResponse } from "next/server";
import { z } from "zod";
import { findCheaperAlternatives, findSimilarProducts, findUpgrade } from "@/lib/recommendations";

const schema = z.object({
  productId: z.string().min(1),
  mode: z.enum(["similar", "cheaper", "upgrade"]).default("similar"),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = schema.safeParse({
    productId: url.searchParams.get("productId"),
    mode: url.searchParams.get("mode") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "productId is required." }, { status: 400 });

  const { productId, mode } = parsed.data;
  const items =
    mode === "cheaper"
      ? await findCheaperAlternatives(productId)
      : mode === "upgrade"
        ? await findUpgrade(productId)
        : await findSimilarProducts(productId);

  return NextResponse.json({ items });
}
