import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  const body = await request.json();
  const record = await prisma.financialRecord.update({
    where: { id },
    data: { ...body, amount: body.amount === undefined ? undefined : Number(body.amount), month: body.month ? new Date(body.month) : undefined }
  });
  return NextResponse.json(serialize(record));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  await prisma.financialRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
