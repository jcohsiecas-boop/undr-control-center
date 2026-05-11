import { Activity, AlertTriangle, CalendarDays, CheckCircle2, CircleDollarSign, ClipboardList, Package, TrendingUp, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/utils";
import { MetricCard } from "@/components/dashboard/metric-card";
import { CashFlowChart, PhaseChart } from "@/components/dashboard/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const tasks = await prisma.task.findMany({ include: { phase: true }, orderBy: { updatedAt: "desc" } });
  const phases = await prisma.phase.findMany({ include: { tasks: true }, orderBy: { order: "asc" } });
  const logs = await prisma.activityLog.findMany({ include: { task: true, user: true }, orderBy: { createdAt: "desc" }, take: 10 });
  const records = await prisma.financialRecord.findMany({ where: { deletedAt: null } });
  const events = await prisma.event.findMany();
  const partners = await prisma.partner.findMany();
  const inventory = await prisma.inventory.findMany();

  const total = tasks.length || 1;
  const completed = tasks.filter((task) => task.status === "COMPLETED").length;
  const pending = tasks.filter((task) => task.status !== "COMPLETED").length;
  const critical = tasks.filter((task) => task.priority === "CRITICAL" && task.status !== "COMPLETED").length;
  const income = records.filter((r) => r.type === "INCOME").reduce((sum, r) => sum + Number(r.paidAmount ?? r.amount), 0);
  const expenses = records.filter((r) => r.type === "EXPENSE").reduce((sum, r) => sum + Number(r.paidAmount ?? r.amount), 0);
  const projectedIncome = records.filter((r) => r.type === "INCOME").reduce((sum, r) => sum + Number(r.amount), 0);
  const projectedExpenses = records.filter((r) => r.type === "EXPENSE").reduce((sum, r) => sum + Number(r.amount), 0);
  const flow = Object.values(
    records.reduce<Record<string, { month: string; income: number; expenses: number }>>((acc, record) => {
      const month = record.month.toISOString().slice(0, 7);
      acc[month] ??= { month, income: 0, expenses: 0 };
      acc[month][record.type === "INCOME" ? "income" : "expenses"] += Number(record.paidAmount ?? record.amount);
      return acc;
    }, {})
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <Badge tone="red" className="w-fit">UNDR Control Center</Badge>
        <h1 className="text-3xl font-semibold tracking-normal">Control ejecutivo, financiero y operativo</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">THE BASS THE RHYTHM & THE KICK S.A.S · plataforma interna para trazabilidad, auditoria y crecimiento.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard href="/tasks" label="Progreso general" value={`${Math.round((completed / total) * 100)}%`} hint={`${completed} tareas completadas de ${tasks.length}`} icon={TrendingUp} />
        <MetricCard href="/tasks" label="Pendientes" value={`${pending}`} hint="Checklist ejecutivo abierto" icon={ClipboardList} />
        <MetricCard href="/tasks" label="Criticas" value={`${critical}`} hint="Requieren desbloqueo" icon={AlertTriangle} />
        <MetricCard href="/financial" label="Utilidad real" value={money(income - expenses)} hint="Solo cobros y pagos reales" icon={CircleDollarSign} />
        <MetricCard href="/events" label="Eventos" value={`${events.length}`} hint="Eventos en control financiero" icon={CalendarDays} />
        <MetricCard href="/partners" label="Socios" value={`${partners.length}`} hint="Participacion y aportes" icon={Users} />
        <MetricCard href="/inventory" label="Activos" value={`${inventory.length}`} hint="Inventario trazable" icon={Package} />
        <MetricCard href="/financial" label="Utilidad proyectada" value={money(projectedIncome - projectedExpenses)} hint="Devengado total registrado" icon={CheckCircle2} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <PhaseChart data={phases.map((phase) => ({ name: phase.name, progress: phase.tasks.length ? Math.round((phase.tasks.filter((task) => task.status === "COMPLETED").length / phase.tasks.length) * 100) : 0 }))} />
        <CashFlowChart data={flow} />
      </section>

      <section id="activity" className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-card/75 backdrop-blur">
          <CardHeader><CardTitle>Actividad reciente</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 rounded-md border border-border bg-background/35 p-3">
                <Activity className="mt-0.5 h-4 w-4 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{log.action.replaceAll("_", " ")}</p>
                  <p className="truncate text-xs text-muted-foreground">{log.task?.title ?? "Registro del sistema"} · {log.createdAt.toLocaleString("es-CO")}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-card/75 backdrop-blur">
          <CardHeader><CardTitle>Tareas criticas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {tasks.filter((task) => task.priority === "CRITICAL").map((task) => (
              <div key={task.id} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{task.title}</p>
                  <Badge tone={task.status === "BLOCKED" ? "amber" : "red"}>{task.status}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{task.phase.name} · {task.progress}% avance</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
