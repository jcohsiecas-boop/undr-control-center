import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  const body = await request.json();

  if (body.participation !== undefined) {
    const participation = Number(body.participation);
    const partners = await prisma.partner.findMany({ select: { id: true, participation: true } });
    const totalParticipation = partners
      .filter((partner) => partner.id !== id)
      .reduce((sum, partner) => sum + Number(partner.participation), 0);

    if (!Number.isFinite(participation) || participation < 0 || participation > 100) {
      return NextResponse.json({ error: "La participacion debe estar entre 0% y 100%." }, { status: 400 });
    }

    if (totalParticipation + participation > 100) {
      const available = Math.max(0, 100 - totalParticipation);
      return NextResponse.json({ error: `La suma de participacion no puede superar 100%. Disponible: ${available.toFixed(1)}%.` }, { status: 400 });
    }
  }

  const partner = await prisma.partner.update({
    where: { id },
    data: {
      ...body,
      contribution: body.contribution === undefined ? undefined : Number(body.contribution),
      withdrawals: body.withdrawals === undefined ? undefined : Number(body.withdrawals),
      loans: body.loans === undefined ? undefined : Number(body.loans),
      participation: body.participation === undefined ? undefined : Number(body.participation)
    }
  });
  return NextResponse.json(serialize(partner));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  await prisma.partner.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
