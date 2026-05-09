import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  const body = await request.json();
  const attachment = await prisma.attachment.create({
    data: { name: body.name, url: body.url, type: body.type, taskId: id, userId: session!.user.id }
  });
  await prisma.activityLog.create({ data: { action: "ATTACHMENT_ADDED", taskId: id, userId: session!.user.id, metadata: { name: body.name, type: body.type } } });
  return NextResponse.json(serialize(attachment), { status: 201 });
}
