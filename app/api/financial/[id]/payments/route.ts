import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";
import { nextDocumentStatus, nextPaymentStatus } from "@/lib/finance";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  const body = await request.json();
  const amount = Number(body.amount || 0);
  const movement = await prisma.financialRecord.findUnique({ where: { id } });
  if (!movement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.$transaction(async (tx) => {
    await tx.movementPayment.create({
      data: {
        movementId: id,
        bankAccountId: body.bankAccountId,
        amount,
        paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
        note: body.note || null
      }
    });
    await tx.bankAccount.update({
      where: { id: body.bankAccountId },
      data: { balance: { increment: movement.type === "INCOME" ? amount : -amount } }
    });
    const paidAmount = Number(movement.paidAmount) + amount;
    const paymentStatus = nextPaymentStatus(Number(movement.amount), paidAmount);
    const documentStatus = nextDocumentStatus(movement.type, movement.documentStatus, paymentStatus);
    return tx.financialRecord.update({
      where: { id },
      data: {
        paidAmount,
        pendingBalance: Math.max(Number(movement.amount) - paidAmount, 0),
        paymentStatus,
        documentStatus,
        bankAccountId: body.bankAccountId
      },
      include: { bankAccount: true, event: true, payments: { include: { bankAccount: true }, orderBy: { paidAt: "desc" } } }
    });
  });
  return NextResponse.json(serialize(updated), { status: 201 });
}
