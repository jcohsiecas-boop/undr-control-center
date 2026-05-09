import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  const body = await request.json();
  const asset = await prisma.inventory.update({
    where: { id },
    data: { ...body, value: body.value === undefined ? undefined : Number(body.value) }
  });
  return NextResponse.json(serialize(asset));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  await prisma.inventory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
