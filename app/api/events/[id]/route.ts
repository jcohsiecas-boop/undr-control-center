import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";
import { slugify } from "@/lib/slug";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  const body = await request.json();
  const slug = body.name ? slugify(body.name) : undefined;
  const event = await prisma.event.update({
    where: { id },
    data: {
      ...body,
      slug,
      date: body.date ? new Date(body.date) : undefined,
      budget: body.budget === undefined ? undefined : Number(body.budget),
      attendees: body.attendees === undefined ? undefined : Number(body.attendees)
    },
    include: { eventFinances: true, lineItems: true }
  });
  return NextResponse.json(serialize(event));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
