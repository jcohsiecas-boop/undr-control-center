import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  const body = await request.json();
  const item = await prisma.eventLineItem.create({
    data: {
      eventId: id,
      type: body.type,
      concept: body.concept,
      quantity: Number(body.quantity || 1),
      unitCost: Number(body.unitCost || 0),
      projected: Number(body.projected || 0),
      actual: Number(body.actual || 0),
      paid: Boolean(body.paid),
      responsible: body.responsible || null
    }
  });
  return NextResponse.json(serialize(item), { status: 201 });
}
