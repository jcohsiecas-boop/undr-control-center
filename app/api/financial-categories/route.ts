import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;
  const categories = await prisma.financialCategory.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(serialize(categories));
}

export async function POST(request: Request) {
  const { response } = await requireSession();
  if (response) return response;
  const body = await request.json();
  const category = await prisma.financialCategory.upsert({
    where: { name_type: { name: body.name, type: body.type } },
    update: {},
    create: { name: body.name, type: body.type }
  });
  return NextResponse.json(serialize(category), { status: 201 });
}
