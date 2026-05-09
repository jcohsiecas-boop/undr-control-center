import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;
  const inventory = await prisma.inventory.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json(serialize(inventory));
}

export async function POST(request: Request) {
  const { response } = await requireSession();
  if (response) return response;
  const body = await request.json();
  const asset = await prisma.inventory.create({ data: { ...body, value: Number(body.value) } });
  return NextResponse.json(serialize(asset), { status: 201 });
}
