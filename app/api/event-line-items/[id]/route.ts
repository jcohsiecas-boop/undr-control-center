import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  const body = await request.json();
  const quantity = body.quantity === undefined ? undefined : Number(body.quantity);
  const unitCost = body.unitCost === undefined ? undefined : Number(body.unitCost);
  const shouldRecalculate = quantity !== undefined || unitCost !== undefined;
  const current = shouldRecalculate ? await prisma.eventLineItem.findUnique({ where: { id } }) : null;
  const nextQuantity = quantity ?? current?.quantity;
  const nextUnitCost = unitCost ?? (current ? Number(current.unitCost) : undefined);
  const actioned = body.actioned === true;
  const item = await prisma.eventLineItem.update({
    where: { id },
    data: {
      type: body.type,
      concept: body.concept,
      quantity,
      unitCost,
      projected: shouldRecalculate && nextQuantity !== undefined && nextUnitCost !== undefined ? nextQuantity * nextUnitCost : undefined,
      actual: body.actual === undefined ? undefined : Number(body.actual),
      paid: actioned ? true : body.paid,
      financialStatus: actioned ? "SETTLED" : body.financialStatus,
      actionedById: actioned ? session!.user.id : undefined,
      actionedAt: actioned ? new Date() : undefined,
      responsible: body.responsible
    },
    include: { actionedBy: true }
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
