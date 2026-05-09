import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  const body = await request.json();
  const comment = await prisma.comment.create({
    data: { body: body.body, taskId: id, userId: session!.user.id },
    include: { user: true }
  });
  await prisma.activityLog.create({ data: { action: "COMMENT_ADDED", taskId: id, userId: session!.user.id } });
  return NextResponse.json(serialize(comment), { status: 201 });
}
