import "server-only";
import { db } from "@/lib/db";

/**
 * All calls to the AI provider happen here, server-side only. AI_API_KEY is never sent
 * to the browser. Every function that returns product information is given the actual
 * database rows in its prompt and is instructed never to state anything not in them.
 */

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";
const FAST_MODEL = "claude-haiku-4-5-20251001";

type Message = { role: "user" | "assistant"; content: string };

async function callAI(system: string, messages: Message[], opts: { model?: string; maxTokens?: number } = {}) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error("AI_API_KEY is not configured. Add it to .env (see .env.example).");

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: opts.model ?? MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      system,
      messages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`AI request failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const data = await response.json();
  return (data.content ?? [])
    .filter((block: { type: string }) => block.type === "text")
    .map((block: { text: string }) => block.text)
    .join("\n")
    .trim();
}

function parseJsonLoosely<T>(text: string, fallback: T): T {
  const cleaned = text.replace(/^```json\s*|^```\s*|```$/gm, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// 1. Extract structured shopping requirements from a free-text message.
// ---------------------------------------------------------------------------

export type ExtractedRequirements = {
  category: string | null;
  brand: string | null;
  color: string | null;
  size: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  purpose: string | null;
  keywords: string[];
  missingInfo: string[]; // things worth asking about (budget, size, OS, etc.)
  replyToCustomer: string; // a short, natural follow-up or acknowledgement
};

const EXTRACT_SYSTEM = `You are the natural-language layer of a shopping assistant.
Read the conversation and extract shopping requirements as JSON only — no prose, no markdown fences.
Never invent a product, price, or brand that the customer didn't imply. If something is unclear, leave it null
and add a short label for it to "missingInfo" (e.g. "budget", "size", "operating system").
Also write "replyToCustomer": one short, friendly sentence — either a clarifying question about the single most
important missing detail, or a brief acknowledgement that you're searching now if enough is known.
Respond with exactly this JSON shape:
{"category":string|null,"brand":string|null,"color":string|null,"size":string|null,"minPrice":number|null,"maxPrice":number|null,"minRating":number|null,"purpose":string|null,"keywords":string[],"missingInfo":string[],"replyToCustomer":string}`;

export async function extractRequirements(history: Message[]): Promise<ExtractedRequirements> {
  const text = await callAI(EXTRACT_SYSTEM, history, { maxTokens: 500 });
  return parseJsonLoosely(text, {
    category: null,
    brand: null,
    color: null,
    size: null,
    minPrice: null,
    maxPrice: null,
    minRating: null,
    purpose: null,
    keywords: [],
    missingInfo: [],
    replyToCustomer: "Could you tell me a bit more about what you're looking for?",
  });
}

// ---------------------------------------------------------------------------
// 2. Explain why matched products fit ("Recommendation Explanation").
// ---------------------------------------------------------------------------

type ProductFacts = {
  id: string;
  name: string;
  price: number;
  rating: number;
  stock: number;
  brand: string | null;
  category: string;
  specs: { key: string; value: string }[];
  tags: string[];
};

function factsBlock(products: ProductFacts[]) {
  return products
    .map(
      (p) =>
        `- id:${p.id} | ${p.name} | brand:${p.brand ?? "n/a"} | category:${p.category} | price:$${p.price} | rating:${p.rating} | stock:${p.stock} | specs:${p.specs.map((s) => `${s.key}=${s.value}`).join(", ") || "none"} | tags:${p.tags.join(", ") || "none"}`,
    )
    .join("\n");
}

const RECOMMEND_SYSTEM = `You are a shopping assistant explaining why specific catalog products match a customer's request.
You are given the customer's request and a list of REAL products with their exact price, stock, rating and specs.
Use ONLY the facts given — never state a spec, price, or availability that isn't listed. If a product is out of
stock, say so plainly. Respond with JSON only, no prose outside it, in this shape:
{"summary": string, "reasons": {"<productId>": string}}
"summary" is one short sentence introducing the results. Each entry in "reasons" is 1-3 short bullet-style clauses
(joined with " • ") explaining why that specific product fits, grounded in the facts given.`;

export async function explainRecommendations(requestSummary: string, products: ProductFacts[]) {
  if (!products.length) return { summary: "No matching products right now.", reasons: {} as Record<string, string> };
  const text = await callAI(
    RECOMMEND_SYSTEM,
    [{ role: "user", content: `Customer request: ${requestSummary}\n\nProducts:\n${factsBlock(products)}` }],
    { maxTokens: 700 },
  );
  return parseJsonLoosely(text, { summary: "Here's what I found.", reasons: {} as Record<string, string> });
}

// ---------------------------------------------------------------------------
// 3. Answer a question about one specific product ("Ask AI About This Product").
// ---------------------------------------------------------------------------

const PRODUCT_QA_SYSTEM = `You answer a customer's question about ONE specific product using only the facts given.
Never invent a specification, price, or stock status. If the facts don't answer the question, say plainly that
the information isn't listed for this product rather than guessing. Keep the answer to 2-4 sentences.`;

export async function answerProductQuestion(product: ProductFacts, question: string) {
  return callAI(
    PRODUCT_QA_SYSTEM,
    [{ role: "user", content: `Product facts:\n${factsBlock([product])}\n\nQuestion: ${question}` }],
    { maxTokens: 400 },
  );
}

// ---------------------------------------------------------------------------
// 4. Compare a small set of products factually.
// ---------------------------------------------------------------------------

const COMPARE_SYSTEM = `You compare a small set of REAL products for a customer, using only the facts given.
Point out concrete trade-offs (price vs. specs vs. rating). Never invent a spec that isn't listed. 3-5 sentences.`;

export async function compareProducts(products: ProductFacts[]) {
  return callAI(COMPARE_SYSTEM, [{ role: "user", content: `Products:\n${factsBlock(products)}` }], { maxTokens: 500 });
}

// ---------------------------------------------------------------------------
// 5. Admin: generate a product description from a name + feature list.
// ---------------------------------------------------------------------------

const DESCRIPTION_SYSTEM = `You write e-commerce product copy from a product name and a feature list the admin provides.
Use ONLY the given features — do not invent specs, certifications, or claims. Respond with JSON only:
{"shortDescription": string (under 160 chars), "fullDescription": string (2-3 short paragraphs), "seoDescription": string (under 160 chars, for search results), "featureList": string[]}`;

export async function generateProductDescription(name: string, features: string) {
  const text = await callAI(DESCRIPTION_SYSTEM, [{ role: "user", content: `Product: ${name}\nFeatures:\n${features}` }], {
    model: FAST_MODEL,
    maxTokens: 700,
  });
  return parseJsonLoosely(text, { shortDescription: "", fullDescription: "", seoDescription: "", featureList: [] as string[] });
}

// ---------------------------------------------------------------------------
// 6. Admin: generate search/recommendation tags.
// ---------------------------------------------------------------------------

const TAGS_SYSTEM = `Generate 5-10 short, lowercase search tags for a product from its name and features.
Tags should be single words or short phrases useful for search and recommendations (e.g. "wireless", "noise cancelling").
Respond with JSON only: {"tags": string[]}`;

export async function generateProductTags(name: string, features: string) {
  const text = await callAI(TAGS_SYSTEM, [{ role: "user", content: `Product: ${name}\nFeatures:\n${features}` }], {
    model: FAST_MODEL,
    maxTokens: 200,
  });
  return parseJsonLoosely(text, { tags: [] as string[] }).tags;
}

// ---------------------------------------------------------------------------
// Helper: load a product from the DB in the shape the AI functions expect.
// ---------------------------------------------------------------------------

export async function loadProductFacts(productId: string): Promise<ProductFacts | null> {
  const p = await db.product.findUnique({
    where: { id: productId },
    include: { brand: true, category: true, specs: true, tags: true },
  });
  if (!p) return null;
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
