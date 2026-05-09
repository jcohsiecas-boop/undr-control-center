import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;
  const partners = await prisma.partner.findMany({ orderBy: { participation: "desc" } });
  return NextResponse.json(serialize(partners));
}

export async function POST(request: Request) {
  const { response } = await requireSession();
  if (response) return response;
  const body = await request.json();
  const partner = await prisma.partner.create({
    data: { ...body, contribution: Number(body.contribution), withdrawals: Number(body.withdrawals), loans: Number(body.loans), participation: Number(body.participation) }
  });
  return NextResponse.json(serialize(partner), { status: 201 });
}
