import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth";
import { badOrigin, isSameOrigin } from "@/lib/http";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return badOrigin();
  const { response } = await requireAdminApi();
  if (response) return response;

  const inUse = await db.product.count({ where: { brandId: params.id } });
  if (inUse > 0) {
    return NextResponse.json({ error: `${inUse} product(s) still use this brand. Reassign them first.` }, { status: 409 });
  }

  await db.brand.deleteMany({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
