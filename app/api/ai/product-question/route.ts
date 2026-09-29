import { NextResponse } from "next/server";
import { z } from "zod";
import { answerProductQuestion, loadProductFacts } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";
import { badOrigin, getClientIp, isSameOrigin, tooManyRequests } from "@/lib/http";

const schema = z.object({ productId: z.string().min(1), question: z.string().min(1).max(500) });

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return badOrigin();

  const limit = rateLimit(`ai-question:${getClientIp(req)}`, 30, 60 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "productId and question are required." }, { status: 400 });

  const product = await loadProductFacts(parsed.data.productId);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  try {
    const answer = await answerProductQuestion(product, parsed.data.question);
    return NextResponse.json({ answer });
  } catch (error) {
    console.error("product-question failed", error);
    return NextResponse.json({ error: "The AI assistant is unavailable right now. Try again shortly." }, { status: 502 });
  }
}
