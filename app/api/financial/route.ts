import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;
  const records = await prisma.financialRecord.findMany({ orderBy: { month: "desc" } });
  return NextResponse.json(serialize(records));
}

export async function POST(request: Request) {
  const { response } = await requireSession();
  if (response) return response;
  const body = await request.json();
  const record = await prisma.financialRecord.create({
    data: { ...body, amount: Number(body.amount), month: new Date(body.month) }
  });
  return NextResponse.json(serialize(record), { status: 201 });
}
