import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: { phase: true, assignee: true, comments: { include: { user: true } }, attachments: true, activityLogs: { include: { user: true }, orderBy: { createdAt: "desc" } } }
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serialize(task));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  const body = await request.json();
  const completedAt = body.status === "COMPLETED" ? new Date() : body.status ? null : undefined;
  const task = await prisma.task.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      progress: body.progress === undefined ? undefined : Number(body.progress),
      tags: body.tags,
      phaseId: body.phaseId,
      assigneeId: body.assigneeId,
      completedAt
    },
    include: { phase: true, assignee: true }
  });
  await prisma.activityLog.create({ data: { action: "TASK_UPDATED", taskId: id, userId: session!.user.id, metadata: body } });
  return NextResponse.json(serialize(task));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  await prisma.activityLog.create({ data: { action: "TASK_DELETED", userId: session!.user.id, metadata: { id } } });
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
