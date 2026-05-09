import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  const body = await request.json();
  const existing = await prisma.financialRecord.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const record = await prisma.$transaction(async (tx) => {
    if (existing.bankAccountId && existing.invoiceStatus !== "RECEIVABLE") {
      await tx.bankAccount.update({
        where: { id: existing.bankAccountId },
        data: { balance: { increment: existing.type === "INCOME" ? -Number(existing.amount) : Number(existing.amount) } }
      });
    }
    const updated = await tx.financialRecord.update({
      where: { id },
      data: { ...body, amount: body.amount === undefined ? undefined : Number(body.amount), month: body.month ? new Date(body.month) : undefined },
      include: { bankAccount: true }
    });
    if (updated.bankAccountId && updated.invoiceStatus !== "RECEIVABLE") {
      await tx.bankAccount.update({
        where: { id: updated.bankAccountId },
        data: { balance: { increment: updated.type === "INCOME" ? Number(updated.amount) : -Number(updated.amount) } }
      });
    }
    return updated;
  });
  return NextResponse.json(serialize(record));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  const existing = await prisma.financialRecord.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: true });
  await prisma.$transaction(async (tx) => {
    if (existing.bankAccountId && existing.invoiceStatus !== "RECEIVABLE") {
      await tx.bankAccount.update({
        where: { id: existing.bankAccountId },
        data: { balance: { increment: existing.type === "INCOME" ? -Number(existing.amount) : Number(existing.amount) } }
      });
    }
    await tx.financialRecord.delete({ where: { id } });
  });
  return NextResponse.json({ ok: true });
}
