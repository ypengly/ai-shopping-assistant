import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth";
import { categorySchema } from "@/lib/admin-validation";
import { badOrigin, isSameOrigin } from "@/lib/http";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return badOrigin();
  const { response } = await requireAdminApi();
  if (response) return response;

  const parsed = categorySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (parsed.data.parentId === params.id) return NextResponse.json({ error: "A category can't be its own parent." }, { status: 400 });

  try {
    const category = await db.category.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json({ category });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A category with this slug already exists." }, { status: 409 });
    }
    console.error("admin category update failed", error);
    return NextResponse.json({ error: "Could not update the category." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return badOrigin();
  const { response } = await requireAdminApi();
  if (response) return response;

  const inUse = await db.product.count({ where: { categoryId: params.id } });
  if (inUse > 0) {
    return NextResponse.json({ error: `${inUse} product(s) still use this category. Reassign them first.` }, { status: 409 });
  }

  await db.category.deleteMany({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
