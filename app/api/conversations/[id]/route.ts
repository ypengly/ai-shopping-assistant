import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PRODUCT_INCLUDE } from "@/lib/types";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to view this conversation." }, { status: 401 });

  const conversation = await db.conversation.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      recommendations: { include: { product: { include: PRODUCT_INCLUDE } } },
    },
  });
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  return NextResponse.json({ conversation });
}
