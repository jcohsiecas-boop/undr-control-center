import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  const body = await request.json();
  const item = await prisma.eventLineItem.update({
    where: { id },
    data: {
      type: body.type,
      concept: body.concept,
      quantity: body.quantity === undefined ? undefined : Number(body.quantity),
      unitCost: body.unitCost === undefined ? undefined : Number(body.unitCost),
      projected: body.projected === undefined ? undefined : Number(body.projected),
      actual: body.actual === undefined ? undefined : Number(body.actual),
      paid: body.paid,
      responsible: body.responsible
    }
  });
  return NextResponse.json(serialize(item));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  await prisma.eventLineItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
