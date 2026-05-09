import { NextResponse } from "next/server";
import { Priority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function GET(request: Request) {
  const { response } = await requireSession();
  if (response) return response;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const status = searchParams.get("status") as TaskStatus | null;
  const priority = searchParams.get("priority") as Priority | null;

  const tasks = await prisma.task.findMany({
    where: {
      ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }, { tags: { has: query } }] } : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {})
    },
    include: { phase: true, assignee: true, comments: { include: { user: true }, orderBy: { createdAt: "desc" } }, attachments: true, activityLogs: { orderBy: { createdAt: "desc" } } },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }]
  });
  return NextResponse.json(serialize(tasks));
}

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  const body = await request.json();
  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description,
      status: body.status ?? "PENDING",
      priority: body.priority ?? "MEDIUM",
      progress: Number(body.progress ?? 0),
      tags: body.tags ?? [],
      phaseId: body.phaseId,
      assigneeId: body.assigneeId ?? session!.user.id
    },
    include: { phase: true, assignee: true }
  });
  await prisma.activityLog.create({ data: { action: "TASK_CREATED", taskId: task.id, userId: session!.user.id, metadata: { title: task.title } } });
  return NextResponse.json(serialize(task), { status: 201 });
}
