import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";
import { defaultDocumentStatus } from "@/lib/finance";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;
  const records = await prisma.financialRecord.findMany({ where: { deletedAt: null }, include: { bankAccount: true, event: true, payments: { include: { bankAccount: true }, orderBy: { paidAt: "desc" } } }, orderBy: { month: "desc" } });
  return NextResponse.json(serialize(records));
}

export async function POST(request: Request) {
  const { response } = await requireSession();
  if (response) return response;
  const body = await request.json();
  const amount = Number(body.amount);
  const paidAmount = Number(body.paidAmount || 0);
  const record = await prisma.financialRecord.create({
    data: {
      type: body.type,
      category: body.category,
      description: body.description,
      amount,
      month: new Date(body.month),
      projected: body.documentStatus === "PROJECTED" || Boolean(body.projected),
      documentStatus: body.documentStatus || defaultDocumentStatus(body.type, Boolean(body.projected)),
      paymentStatus: paidAmount > 0 ? (paidAmount >= amount ? "SETTLED" : "PARTIAL") : "PENDING",
      paidAmount,
      pendingBalance: Math.max(amount - paidAmount, 0),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      responsible: body.responsible || null,
      eventId: body.eventId || null,
      taxType: body.taxType || "NONE",
      taxPaid: Boolean(body.taxPaid),
      bankAccountId: body.bankAccountId || null
    },
    include: { bankAccount: true, event: true, payments: true }
  });
  return NextResponse.json(serialize(record), { status: 201 });
}

export async function DELETE() {
  const { response } = await requireSession();
  if (response) return response;
  await prisma.$transaction(async (tx) => {
    await tx.movementPayment.deleteMany();
    await tx.financialRecord.updateMany({ where: { deletedAt: null }, data: { deletedAt: new Date(), documentStatus: "CANCELLED" } });
    await tx.bankAccount.deleteMany();
  });
  return NextResponse.json({ ok: true });
}
