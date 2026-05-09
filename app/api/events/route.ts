import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;
  const events = await prisma.event.findMany({ include: { eventFinances: true }, orderBy: { date: "desc" } });
  return NextResponse.json(serialize(events));
}

export async function POST(request: Request) {
  const { response } = await requireSession();
  if (response) return response;
  const body = await request.json();
  const event = await prisma.event.create({
    data: { ...body, date: new Date(body.date), budget: Number(body.budget), attendees: Number(body.attendees ?? 0) }
  });
  return NextResponse.json(serialize(event), { status: 201 });
}
