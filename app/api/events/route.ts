import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";
import { slugify } from "@/lib/slug";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;
  const events = await prisma.event.findMany({ include: { eventFinances: true, lineItems: true }, orderBy: { date: "desc" } });
  return NextResponse.json(serialize(events));
}

export async function POST(request: Request) {
  const { response } = await requireSession();
  if (response) return response;
  const body = await request.json();
  const baseSlug = slugify(body.slug || body.name || body.eventId);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.event.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
  const event = await prisma.event.create({
    data: { ...body, slug, status: body.status || "PLANNING", date: new Date(body.date), budget: Number(body.budget), attendees: Number(body.attendees ?? 0) }
  });
  return NextResponse.json(serialize(event), { status: 201 });
}
