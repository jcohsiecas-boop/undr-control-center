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
  const participation = Number(body.participation);
  const partners = await prisma.partner.findMany({ select: { participation: true } });
  const totalParticipation = partners.reduce((sum, partner) => sum + Number(partner.participation), 0);

  if (!Number.isFinite(participation) || participation < 0 || participation > 100) {
    return NextResponse.json({ error: "La participacion debe estar entre 0% y 100%." }, { status: 400 });
  }

  if (totalParticipation + participation > 100) {
    const available = Math.max(0, 100 - totalParticipation);
    return NextResponse.json({ error: `La suma de participacion no puede superar 100%. Disponible: ${available.toFixed(1)}%.` }, { status: 400 });
  }

  const partner = await prisma.partner.create({
    data: { ...body, contribution: Number(body.contribution), withdrawals: Number(body.withdrawals), loans: Number(body.loans), participation }
  });
  return NextResponse.json(serialize(partner), { status: 201 });
}
