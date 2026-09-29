import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { badOrigin, isSameOrigin } from "@/lib/http";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return badOrigin();
  destroySession();
  return NextResponse.json({ ok: true });
}
