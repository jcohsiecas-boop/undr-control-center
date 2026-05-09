import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;
  const accounts = await prisma.bankAccount.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json(serialize(accounts));
}

export async function POST(request: Request) {
  const { response } = await requireSession();
  if (response) return response;
  const body = await request.json();
  const account = await prisma.bankAccount.create({
    data: {
      name: body.name,
      bank: body.bank,
      accountNo: body.accountNo || null,
      currency: body.currency || "COP",
      balance: Number(body.balance || 0)
    }
  });
  return NextResponse.json(serialize(account), { status: 201 });
}
