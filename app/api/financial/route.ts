import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;
  const records = await prisma.financialRecord.findMany({ include: { bankAccount: true }, orderBy: { month: "desc" } });
  return NextResponse.json(serialize(records));
}

export async function POST(request: Request) {
  const { response } = await requireSession();
  if (response) return response;
  const body = await request.json();
  const amount = Number(body.amount);
  const record = await prisma.$transaction(async (tx) => {
    const created = await tx.financialRecord.create({
      data: { ...body, amount, month: new Date(body.month) },
      include: { bankAccount: true }
    });
    if (body.bankAccountId && body.invoiceStatus !== "RECEIVABLE") {
      await tx.bankAccount.update({
        where: { id: body.bankAccountId },
        data: { balance: { increment: body.type === "INCOME" ? amount : -amount } }
      });
    }
    return created;
  });
  return NextResponse.json(serialize(record), { status: 201 });
}

export async function DELETE() {
  const { response } = await requireSession();
  if (response) return response;
  await prisma.$transaction(async (tx) => {
    await tx.financialRecord.deleteMany();
    await tx.bankAccount.deleteMany();
  });
  return NextResponse.json({ ok: true });
}
