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
    data: {
      type: body.type,
      category: body.category,
      description: body.description,
      amount: body.amount === undefined ? undefined : Number(body.amount),
      month: body.month ? new Date(body.month) : undefined,
      documentStatus: body.documentStatus,
      paymentStatus: body.paymentStatus,
      dueDate: body.dueDate ? new Date(body.dueDate) : body.dueDate === null ? null : undefined,
      responsible: body.responsible,
      eventId: body.eventId,
      taxType: body.taxType,
      taxPaid: body.taxPaid,
      bankAccountId: body.bankAccountId
    },
    include: { bankAccount: true, event: true, payments: { include: { bankAccount: true } } }
  });
  return NextResponse.json(serialize(record));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  await prisma.financialRecord.update({ where: { id }, data: { deletedAt: new Date(), documentStatus: "CANCELLED" } });
  return NextResponse.json({ ok: true });
}
