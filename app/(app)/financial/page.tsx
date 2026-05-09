import { ArrowDownCircle, ArrowUpCircle, CircleDollarSign, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/utils";
import { MetricCard } from "@/components/dashboard/metric-card";
import { CashFlowChart } from "@/components/dashboard/charts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default async function FinancialPage() {
  const records = await prisma.financialRecord.findMany({ orderBy: { month: "desc" } });
  const income = records.filter((r) => r.type === "INCOME").reduce((sum, r) => sum + Number(r.amount), 0);
  const expenses = records.filter((r) => r.type === "EXPENSE").reduce((sum, r) => sum + Number(r.amount), 0);
  const projectedUtility = records.filter((r) => r.projected).reduce((sum, r) => sum + (r.type === "INCOME" ? Number(r.amount) : -Number(r.amount)), 0);
  const realUtility = records.filter((r) => !r.projected).reduce((sum, r) => sum + (r.type === "INCOME" ? Number(r.amount) : -Number(r.amount)), 0);
  const flow = Object.values(records.reduce<Record<string, { month: string; income: number; expenses: number }>>((acc, record) => {
    const month = record.month.toISOString().slice(0, 7);
    acc[month] ??= { month, income: 0, expenses: 0 };
    acc[month][record.type === "INCOME" ? "income" : "expenses"] += Number(record.amount);
    return acc;
  }, {})).reverse();

  return (
    <div className="space-y-6">
      <section><Badge tone="red">Dashboard Financiero</Badge><h1 className="mt-3 text-3xl font-semibold">Caja, utilidad y flujo mensual</h1></section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ingresos" value={money(income)} hint="Ingresos reales y proyectados" icon={ArrowUpCircle} />
        <MetricCard label="Gastos" value={money(expenses)} hint="Costos operativos y produccion" icon={ArrowDownCircle} />
        <MetricCard label="Utilidad real" value={money(realUtility)} hint="Registros no proyectados" icon={CircleDollarSign} />
        <MetricCard label="Utilidad proyectada" value={money(projectedUtility)} hint="Pipeline financiero" icon={TrendingUp} />
      </section>
      <CashFlowChart data={flow} />
      <Card className="overflow-hidden bg-card/75 backdrop-blur">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Mes</th><th>Tipo</th><th>Categoria</th><th>Descripcion</th><th>Monto</th><th>Modo</th></tr></thead>
          <tbody>{records.map((record) => <tr key={record.id} className="border-t border-border"><td className="p-3">{record.month.toISOString().slice(0, 7)}</td><td>{record.type}</td><td>{record.category}</td><td>{record.description}</td><td>{money(Number(record.amount))}</td><td><Badge tone={record.projected ? "blue" : "green"}>{record.projected ? "Proyectado" : "Real"}</Badge></td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}
