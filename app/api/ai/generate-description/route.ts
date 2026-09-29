import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth";
import { generateProductDescription } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";
import { badOrigin, isSameOrigin, tooManyRequests } from "@/lib/http";

const schema = z.object({ name: z.string().min(1).max(200), features: z.string().min(1).max(2000) });

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return badOrigin();

  const { user, response } = await requireAdminApi();
  if (response) return response;

  const limit = rateLimit(`ai-desc:${user.id}`, 40, 60 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "name and features are required." }, { status: 400 });

  try {
    const result = await generateProductDescription(parsed.data.name, parsed.data.features);
    return NextResponse.json(result);
  } catch (error) {
    console.error("generate-description failed", error);
    return NextResponse.json({ error: "The AI assistant is unavailable right now." }, { status: 502 });
  }
}
