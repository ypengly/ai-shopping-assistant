import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth";
import { getContactSettings, setSettings } from "@/lib/settings";
import { badOrigin, isSameOrigin } from "@/lib/http";

const schema = z.object({
  contactChannel: z.enum(["Telegram", "Phone", "Messenger", "Contact form"]),
  contactValue: z.string().max(200).default(""),
  contactInstructions: z.string().max(500).default(""),
});

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) return response;
  return NextResponse.json(await getContactSettings());
}

export async function PUT(req: Request) {
  if (!isSameOrigin(req)) return badOrigin();
  const { response } = await requireAdminApi();
  if (response) return response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the highlighted fields." }, { status: 400 });

  await setSettings(parsed.data);
  return NextResponse.json({ ok: true });
}
