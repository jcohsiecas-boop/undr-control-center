import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  const body = await request.json();
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
