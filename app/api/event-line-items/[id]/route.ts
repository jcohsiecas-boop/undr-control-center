import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";
import { EventLineType } from "@prisma/client";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  const body = await request.json();
  const quantity = body.quantity === undefined ? undefined : Number(body.quantity);
  const unitCost = body.unitCost === undefined ? undefined : Number(body.unitCost);
  const shouldRecalculate = quantity !== undefined || unitCost !== undefined;
  const current = shouldRecalculate || body.actioned === true ? await prisma.eventLineItem.findUnique({ where: { id }, include: { event: true } }) : null;
  const nextQuantity = quantity ?? current?.quantity;
  const nextUnitCost = unitCost ?? (current ? Number(current.unitCost) : undefined);
  const actioned = body.actioned === true;
  const item = await prisma.$transaction(async (tx) => {
    if (actioned && current && !current.actionedAt) {
      const isIncome = current.type === EventLineType.INCOME || current.type === EventLineType.SPONSOR;
      const amount = Number(current.actual) > 0 ? Number(current.actual) : Number(current.projected);
      await tx.financialRecord.create({
        data: {
          type: isIncome ? "INCOME" : "EXPENSE",
          category: current.type === EventLineType.SPONSOR ? "Patrocinio" : current.type === EventLineType.PERSONNEL ? "Personal" : isIncome ? "Ingreso evento" : "Gasto evento",
          description: `${current.event.name} - ${current.concept || current.type}`,
          amount,
          month: current.event.date,
          projected: false,
          invoiceStatus: isIncome ? "RECEIVABLE" : "RECEIVABLE",
          documentStatus: isIncome ? "INVOICED" : "COMMITTED",
          paymentStatus: "PENDING",
          paidAmount: 0,
          pendingBalance: amount,
          dueDate: current.event.date,
          responsible: current.responsible,
          eventId: current.eventId,
          taxType: "NONE"
        }
      });
    }
    return tx.eventLineItem.update({
      where: { id },
      data: {
        type: body.type,
        concept: body.concept,
        quantity,
        unitCost,
        projected: shouldRecalculate && nextQuantity !== undefined && nextUnitCost !== undefined ? nextQuantity * nextUnitCost : undefined,
        actual: body.actual === undefined ? undefined : Number(body.actual),
        paid: body.paid,
        financialStatus: actioned ? "PENDING" : body.financialStatus,
        actionedById: actioned ? session!.user.id : undefined,
        actionedAt: actioned ? new Date() : undefined,
        responsible: body.responsible
      },
      include: { actionedBy: true }
    });
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
