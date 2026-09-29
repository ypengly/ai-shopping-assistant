import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { explainRecommendations, extractRequirements } from "@/lib/ai";
import { applyUserPreferences, recordRecommendations } from "@/lib/recommendations";
import { requirementsToFilters, searchProducts } from "@/lib/search";
import { PRODUCT_INCLUDE } from "@/lib/types";
import { rateLimit } from "@/lib/rate-limit";
import { badOrigin, getClientIp, isSameOrigin, tooManyRequests } from "@/lib/http";

const schema = z.object({
  message: z.string().min(1).max(1000),
  conversationId: z.string().min(1).optional(),
});

const MAX_HISTORY = 12;

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return badOrigin();

  const user = await getCurrentUser();
  const limitKey = user ? `ai-shopping:${user.id}` : `ai-shopping:${getClientIp(req)}`;
  const limit = rateLimit(limitKey, 30, 60 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A message is required." }, { status: 400 });
  if (!user) return NextResponse.json({ error: "Sign in to use the AI shopping assistant." }, { status: 401 });

  const { message, conversationId } = parsed.data;

  let conversation = conversationId
    ? await db.conversation.findFirst({ where: { id: conversationId, userId: user.id } })
    : null;
  if (!conversation) {
    conversation = await db.conversation.create({
      data: { userId: user.id, title: message.slice(0, 60) },
    });
  }

  await db.message.create({ data: { conversationId: conversation.id, role: "user", content: message } });

  const history = await db.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: MAX_HISTORY,
  });

  try {
    const requirements = await extractRequirements(history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));

    let products: Awaited<ReturnType<typeof searchProducts>>["items"] = [];
    let reasons: Record<string, string> = {};
    let assistantReply = requirements.replyToCustomer;

    const enoughToSearch = requirements.category || requirements.brand || requirements.keywords.length > 0 || requirements.minPrice || requirements.maxPrice;

    if (enoughToSearch) {
      const baseFilters = await requirementsToFilters(requirements);
      const filters = await applyUserPreferences(user.id, baseFilters);
      const result = await searchProducts({ ...filters, pageSize: 8 });
      products = result.items;

      if (products.length) {
        const explanation = await explainRecommendations(message, products.map(toFacts));
        assistantReply = `${requirements.replyToCustomer} ${explanation.summary}`.trim();
        reasons = explanation.reasons;
        await recordRecommendations(
          user.id,
          conversation.id,
          products.map((p) => ({ productId: p.id, reason: reasons[p.id] ?? "Matches your request." })),
        );
      } else {
        assistantReply = `I couldn't find a product matching that right now. Would you like to adjust the budget or try a different category?`;
      }
    }

    await db.message.create({ data: { conversationId: conversation.id, role: "assistant", content: assistantReply } });
    await db.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

    return NextResponse.json({
      conversationId: conversation.id,
      reply: assistantReply,
      requirements,
      products,
      reasons,
    });
  } catch (error) {
    console.error("ai/shopping failed", error);
    const fallback = "I'm having trouble reaching the AI assistant right now. Please try again in a moment.";
    await db.message.create({ data: { conversationId: conversation.id, role: "assistant", content: fallback } }).catch(() => {});
    return NextResponse.json({ error: fallback, conversationId: conversation.id }, { status: 502 });
  }
}

function toFacts(p: Awaited<ReturnType<typeof searchProducts>>["items"][number]) {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    rating: p.rating,
    stock: p.stock,
    brand: p.brand?.name ?? null,
    category: p.category.name,
    specs: p.specs.map((s) => ({ key: s.key, value: s.value })),
    tags: p.tags.map((t) => t.tag),
  };
}
