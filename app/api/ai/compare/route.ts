import { NextResponse } from "next/server";
import { z } from "zod";
import { compareProducts, loadProductFacts } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";
import { badOrigin, getClientIp, isSameOrigin, tooManyRequests } from "@/lib/http";

const schema = z.object({ productIds: z.array(z.string().min(1)).min(2).max(4) });

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return badOrigin();

  const limit = rateLimit(`ai-compare:${getClientIp(req)}`, 20, 60 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Provide 2 to 4 productIds." }, { status: 400 });

  const products = (await Promise.all(parsed.data.productIds.map(loadProductFacts))).filter(Boolean);
  if (products.length < 2) return NextResponse.json({ error: "Could not load enough products to compare." }, { status: 404 });

  try {
    const analysis = await compareProducts(products as NonNullable<typeof products[number]>[]);
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("compare failed", error);
    return NextResponse.json({ error: "The AI assistant is unavailable right now. Try again shortly." }, { status: 502 });
  }
}
