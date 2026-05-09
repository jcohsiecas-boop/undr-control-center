import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, serialize } from "@/lib/api";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const tasks = await prisma.task.findMany({ include: { phase: true, assignee: true, comments: true, attachments: true }, orderBy: { updatedAt: "desc" } });
  const phases = await prisma.phase.findMany({ include: { tasks: true }, orderBy: { order: "asc" } });
  const activity = await prisma.activityLog.findMany({ include: { user: true, task: true }, orderBy: { createdAt: "desc" }, take: 12 });
  const financial = await prisma.financialRecord.findMany();
  const events = await prisma.event.findMany({ include: { eventFinances: true }, orderBy: { date: "desc" } });
  const partners = await prisma.partner.findMany();
  const inventory = await prisma.inventory.findMany();

  const total = tasks.length || 1;
  const completed = tasks.filter((task) => task.status === "COMPLETED").length;
  const critical = tasks.filter((task) => task.priority === "CRITICAL" && task.status !== "COMPLETED").length;
  const income = financial.filter((r) => r.type === "INCOME").reduce((sum, r) => sum + Number(r.amount), 0);
  const expenses = financial.filter((r) => r.type === "EXPENSE").reduce((sum, r) => sum + Number(r.amount), 0);

  return NextResponse.json(
    serialize({
      stats: {
        progress: Math.round((completed / total) * 100),
        completed,
        pending: tasks.filter((task) => task.status !== "COMPLETED").length,
        critical,
        income,
        expenses,
        utility: income - expenses,
        events: events.length,
        partners: partners.length,
        assets: inventory.length
      },
      phaseProgress: phases.map((phase) => ({
        name: phase.name,
        total: phase.tasks.length,
        completed: phase.tasks.filter((task) => task.status === "COMPLETED").length,
        progress: phase.tasks.length ? Math.round((phase.tasks.filter((task) => task.status === "COMPLETED").length / phase.tasks.length) * 100) : 0
      })),
      tasks,
      activity,
      monthlyFlow: financial.map((record) => ({
        month: record.month.toISOString().slice(0, 7),
        type: record.type,
        amount: Number(record.amount),
        projected: record.projected
      }))
    })
  );
}
