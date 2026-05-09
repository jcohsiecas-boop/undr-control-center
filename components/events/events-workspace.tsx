"use client";

import { useState } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { money } from "@/lib/utils";

type Line = { id: string; type: "INCOME" | "EXPENSE" | "PERSONNEL" | "SPONSOR"; concept: string; quantity: number; unitCost: string | number; projected: string | number; actual: string | number; paid: boolean; responsible: string | null };
type EventItem = { id: string; eventId: string; name: string; date: string; budget: string | number; sponsors: string[]; attendees: number; lineItems: Line[]; eventFinances: { income: string | number; expenses: string | number; utility: string | number; roi: string | number }[] };

export function EventsWorkspace({ initialEvents }: { initialEvents: EventItem[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [selectedId, setSelectedId] = useState(initialEvents[0]?.id ?? "");
  const [eventDraft, setEventDraft] = useState({ eventId: "", name: "", date: new Date().toISOString().slice(0, 10), budget: "", sponsors: "", attendees: "" });
  const [lineDraft, setLineDraft] = useState({ type: "EXPENSE", concept: "", quantity: "1", unitCost: "", projected: "", actual: "", paid: false, responsible: "" });
  const selected = events.find((event) => event.id === selectedId) ?? events[0];
  const lines = selected?.lineItems ?? [];
  const projectedIncome = lines.filter((l) => l.type === "INCOME" || l.type === "SPONSOR").reduce((s, l) => s + Number(l.projected), 0);
  const projectedExpense = lines.filter((l) => l.type === "EXPENSE" || l.type === "PERSONNEL").reduce((s, l) => s + Number(l.projected), 0);
  const actualIncome = lines.filter((l) => l.type === "INCOME" || l.type === "SPONSOR").reduce((s, l) => s + Number(l.actual), 0);
  const actualExpense = lines.filter((l) => l.type === "EXPENSE" || l.type === "PERSONNEL").reduce((s, l) => s + Number(l.actual), 0);

  async function createEvent(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...eventDraft, budget: Number(eventDraft.budget || 0), attendees: Number(eventDraft.attendees || 0), sponsors: eventDraft.sponsors.split(",").map((s) => s.trim()).filter(Boolean) })
    });
    const created = await response.json();
    const normalized = { ...created, lineItems: [], eventFinances: [] };
    setEvents((current) => [normalized, ...current]);
    setSelectedId(created.id);
    setEventDraft({ eventId: "", name: "", date: new Date().toISOString().slice(0, 10), budget: "", sponsors: "", attendees: "" });
  }

  async function deleteEvent(id: string) {
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    setEvents((current) => current.filter((event) => event.id !== id));
    setSelectedId(events.find((event) => event.id !== id)?.id ?? "");
  }

  async function createLine(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const response = await fetch(`/api/events/${selected.id}/line-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lineDraft, quantity: Number(lineDraft.quantity), unitCost: Number(lineDraft.unitCost || 0), projected: Number(lineDraft.projected || 0), actual: Number(lineDraft.actual || 0) })
    });
    const item = await response.json();
    setEvents((current) => current.map((event) => (event.id === selected.id ? { ...event, lineItems: [item, ...event.lineItems] } : event)));
    setLineDraft({ type: "EXPENSE", concept: "", quantity: "1", unitCost: "", projected: "", actual: "", paid: false, responsible: "" });
  }

  async function deleteLine(id: string) {
    await fetch(`/api/event-line-items/${id}`, { method: "DELETE" });
    setEvents((current) => current.map((event) => ({ ...event, lineItems: event.lineItems.filter((line) => line.id !== id) })));
  }

  return (
    <div className="space-y-6">
      <section><Badge tone="red">Eventos</Badge><h1 className="mt-3 text-3xl font-semibold">Presupuesto, real, gastos y personal</h1></section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Eventos" value={`${events.length}`} hint="Eventos registrados" icon={CalendarDays} />
        <MetricCard label="Ingreso real" value={money(actualIncome)} hint="Tickets, sponsors y ventas" icon={CalendarDays} />
        <MetricCard label="Gasto real" value={money(actualExpense)} hint="Produccion y personal" icon={CalendarDays} />
        <MetricCard label="Utilidad real" value={money(actualIncome - actualExpense)} hint="Resultado del evento" icon={CalendarDays} />
      </section>
      <Card className="bg-card/75 p-5">
        <h2 className="mb-4 text-sm font-semibold">Nuevo evento</h2>
        <form className="grid gap-3 lg:grid-cols-6" onSubmit={createEvent}>
          <Input placeholder="EVENT_ID" value={eventDraft.eventId} onChange={(e) => setEventDraft({ ...eventDraft, eventId: e.target.value })} />
          <Input placeholder="Nombre" value={eventDraft.name} onChange={(e) => setEventDraft({ ...eventDraft, name: e.target.value })} />
          <Input type="date" value={eventDraft.date} onChange={(e) => setEventDraft({ ...eventDraft, date: e.target.value })} />
          <Input type="number" placeholder="Presupuesto" value={eventDraft.budget} onChange={(e) => setEventDraft({ ...eventDraft, budget: e.target.value })} />
          <Input placeholder="Sponsors separados por coma" value={eventDraft.sponsors} onChange={(e) => setEventDraft({ ...eventDraft, sponsors: e.target.value })} />
          <Button><Plus className="h-4 w-4" /> Crear</Button>
        </form>
      </Card>
      <section className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <Card className="bg-card/75 p-4">
          <h2 className="mb-3 text-sm font-semibold">Eventos</h2>
          <div className="space-y-2">{events.map((event) => <button key={event.id} onClick={() => setSelectedId(event.id)} className="block w-full rounded-md border border-border p-3 text-left hover:bg-muted"><div className="flex justify-between gap-3"><span className="text-sm font-medium">{event.name}</span><Badge>{event.eventId}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString("es-CO")}</p></button>)}</div>
        </Card>
        <Card className="bg-card/75 p-4">
          {selected ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">{selected.name}</h2><p className="text-xs text-muted-foreground">Proyectado: {money(projectedIncome - projectedExpense)} · Real: {money(actualIncome - actualExpense)}</p></div><Button variant="outline" onClick={() => deleteEvent(selected.id)}><Trash2 className="h-4 w-4" /> Eliminar evento</Button></div>
              <form className="mb-4 grid gap-2 lg:grid-cols-8" onSubmit={createLine}>
                <Select value={lineDraft.type} onChange={(e) => setLineDraft({ ...lineDraft, type: e.target.value })}><option value="INCOME">Ingreso</option><option value="EXPENSE">Gasto</option><option value="PERSONNEL">Personal</option><option value="SPONSOR">Sponsor</option></Select>
                <Input placeholder="Concepto" value={lineDraft.concept} onChange={(e) => setLineDraft({ ...lineDraft, concept: e.target.value })} />
                <Input type="number" placeholder="Cantidad" value={lineDraft.quantity} onChange={(e) => setLineDraft({ ...lineDraft, quantity: e.target.value })} />
                <Input type="number" placeholder="Costo unit." value={lineDraft.unitCost} onChange={(e) => setLineDraft({ ...lineDraft, unitCost: e.target.value })} />
                <Input type="number" placeholder="Proyectado" value={lineDraft.projected} onChange={(e) => setLineDraft({ ...lineDraft, projected: e.target.value })} />
                <Input type="number" placeholder="Real" value={lineDraft.actual} onChange={(e) => setLineDraft({ ...lineDraft, actual: e.target.value })} />
                <Input placeholder="Responsable" value={lineDraft.responsible} onChange={(e) => setLineDraft({ ...lineDraft, responsible: e.target.value })} />
                <Button>Agregar</Button>
              </form>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm"><thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Tipo</th><th>Concepto</th><th>Cant.</th><th>Unit.</th><th>Proyectado</th><th>Real</th><th>Responsable</th><th></th></tr></thead><tbody>{lines.map((line) => <tr key={line.id} className="border-t border-border"><td className="p-3">{line.type}</td><td>{line.concept}</td><td>{line.quantity}</td><td>{money(Number(line.unitCost))}</td><td>{money(Number(line.projected))}</td><td>{money(Number(line.actual))}</td><td>{line.responsible}</td><td><Button size="sm" variant="outline" onClick={() => deleteLine(line.id)}><Trash2 className="h-4 w-4" /></Button></td></tr>)}</tbody></table>
              </div>
            </>
          ) : <p className="text-sm text-muted-foreground">Crea o selecciona un evento.</p>}
        </Card>
      </section>
    </div>
  );
}
