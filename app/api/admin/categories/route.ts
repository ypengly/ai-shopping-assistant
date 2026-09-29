import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth";
import { categorySchema } from "@/lib/admin-validation";
import { badOrigin, isSameOrigin } from "@/lib/http";

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) return response;

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true, children: true } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return badOrigin();
  const { response } = await requireAdminApi();
  if (response) return response;

  const parsed = categorySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });

  try {
    const category = await db.category.create({ data: parsed.data });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A category with this slug already exists.", fieldErrors: { slug: ["Already in use."] } }, { status: 409 });
    }
    console.error("admin category create failed", error);
    return NextResponse.json({ error: "Could not create the category." }, { status: 500 });
  }
}
