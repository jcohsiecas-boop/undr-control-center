import { CalendarDays, Percent, Ticket, WalletCards } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/utils";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default async function EventsPage() {
  const events = await prisma.event.findMany({ include: { eventFinances: true }, orderBy: { date: "desc" } });
  const attendees = events.reduce((sum, event) => sum + event.attendees, 0);
  const utility = events.reduce((sum, event) => sum + event.eventFinances.reduce((s, f) => s + Number(f.utility), 0), 0);
  const avgRoi = events.length ? events.reduce((sum, event) => sum + Number(event.eventFinances[0]?.roi ?? 0), 0) / events.length : 0;

  return (
    <div className="space-y-6">
      <section><Badge tone="red">Eventos</Badge><h1 className="mt-3 text-3xl font-semibold">Presupuesto, sponsors, ROI y asistencia</h1></section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Eventos" value={`${events.length}`} hint="Eventos registrados" icon={CalendarDays} />
        <MetricCard label="Asistentes" value={`${attendees.toLocaleString("es-CO")}`} hint="Total acumulado" icon={Ticket} />
        <MetricCard label="Utilidad" value={money(utility)} hint="Utilidad consolidada" icon={WalletCards} />
        <MetricCard label="ROI promedio" value={`${avgRoi.toFixed(1)}%`} hint="Retorno por evento" icon={Percent} />
      </section>
      <Card className="overflow-hidden bg-card/75 backdrop-blur">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">EVENT_ID</th><th>Evento</th><th>Fecha</th><th>Presupuesto</th><th>Ingresos</th><th>Gastos</th><th>Sponsors</th><th>Utilidad</th><th>ROI</th><th>Asistentes</th></tr></thead>
          <tbody>{events.map((event) => { const finance = event.eventFinances[0]; return <tr key={event.id} className="border-t border-border"><td className="p-3 font-mono text-xs">{event.eventId}</td><td>{event.name}</td><td>{event.date.toLocaleDateString("es-CO")}</td><td>{money(Number(event.budget))}</td><td>{money(Number(finance?.income ?? 0))}</td><td>{money(Number(finance?.expenses ?? 0))}</td><td>{event.sponsors.join(", ")}</td><td>{money(Number(finance?.utility ?? 0))}</td><td>{Number(finance?.roi ?? 0).toFixed(1)}%</td><td>{event.attendees}</td></tr>; })}</tbody>
        </table>
      </Card>
    </div>
  );
}
