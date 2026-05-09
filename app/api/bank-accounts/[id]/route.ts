import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  const body = await request.json();
  const account = await prisma.bankAccount.update({
    where: { id },
    data: {
      name: body.name,
      bank: body.bank,
      accountNo: body.accountNo,
      currency: body.currency,
      balance: body.balance === undefined ? undefined : Number(body.balance)
    }
  });
  return NextResponse.json(serialize(account));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  await prisma.bankAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
