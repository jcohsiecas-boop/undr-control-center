import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  const body = await request.json();
  const quantity = Number(body.quantity || 1);
  const unitCost = Number(body.unitCost || 0);
  const item = await prisma.eventLineItem.create({
    data: {
      eventId: id,
      type: body.type,
      concept: body.concept,
      quantity,
      unitCost,
      projected: quantity * unitCost,
      actual: 0,
      paid: false,
      financialStatus: "PENDING",
      responsible: body.responsible || null
    }
  });
  return NextResponse.json(serialize(item), { status: 201 });
}
