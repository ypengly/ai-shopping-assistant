import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth";
import { brandSchema } from "@/lib/admin-validation";
import { badOrigin, isSameOrigin } from "@/lib/http";

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) return response;

  const brands = await db.brand.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } });
  return NextResponse.json({ brands });
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return badOrigin();
  const { response } = await requireAdminApi();
  if (response) return response;

  const parsed = brandSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });

  try {
    const brand = await db.brand.create({ data: parsed.data });
    return NextResponse.json({ brand }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A brand with this name already exists." }, { status: 409 });
    }
    console.error("admin brand create failed", error);
    return NextResponse.json({ error: "Could not create the brand." }, { status: 500 });
  }
}
