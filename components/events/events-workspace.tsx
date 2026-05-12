"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, DoorOpen, Plus, Trash2 } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { money } from "@/lib/utils";

type Line = { type: "INCOME" | "EXPENSE" | "PERSONNEL" | "SPONSOR"; projected: string | number; actual: string | number; financialStatus: "PENDING" | "PARTIAL" | "SETTLED" };
type EventStatus = "PROPOSAL" | "PLANNING" | "ACTIVE" | "CLOSED" | "CANCELLED";
type EventItem = { id: string; eventId: string; slug: string; name: string; date: string; budget: string | number; status: EventStatus; lineItems: Line[] };

export function EventsWorkspace({ initialEvents }: { initialEvents: EventItem[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [eventDraft, setEventDraft] = useState({ eventId: "", name: "", date: new Date().toISOString().slice(0, 10), budget: "", status: "PLANNING" });

  async function createEvent(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...eventDraft, budget: Number(eventDraft.budget || 0), sponsors: [], attendees: 0 })
    });
    const created = await response.json();
    setEvents((current) => [{ ...created, lineItems: [] }, ...current]);
    setEventDraft({ eventId: "", name: "", date: new Date().toISOString().slice(0, 10), budget: "", status: "PLANNING" });
  }

  async function deleteEvent(id: string) {
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    setEvents((current) => current.filter((event) => event.id !== id));
  }

  async function updateEventStatus(id: string, status: EventStatus) {
    const response = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const updated = await response.json();
    setEvents((current) => current.map((event) => (event.id === id ? { ...event, status: updated.status } : event)));
  }

  const actualIncome = events.reduce((sum, event) => sum + event.lineItems.filter((line) => line.type === "INCOME" || line.type === "SPONSOR").reduce((s, l) => s + Number(l.actual), 0), 0);
  const actualExpense = events.reduce((sum, event) => sum + event.lineItems.filter((line) => line.type === "EXPENSE" || line.type === "PERSONNEL").reduce((s, l) => s + Number(l.actual), 0), 0);

  return (
    <div className="space-y-6">
      <section><Badge tone="red">Eventos</Badge><h1 className="mt-3 text-3xl font-semibold">Eventos creados</h1><p className="mt-2 text-sm text-muted-foreground">Cada evento abre su propio centro financiero y operativo.</p></section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Eventos" value={`${events.length}`} hint="Eventos registrados" icon={CalendarDays} />
        <MetricCard label="Ingreso real" value={money(actualIncome)} hint="Consolidado eventos" icon={CalendarDays} />
        <MetricCard label="Egreso real" value={money(actualExpense)} hint="Produccion y personal" icon={CalendarDays} />
        <MetricCard label="Utilidad real" value={money(actualIncome - actualExpense)} hint="Resultado consolidado" icon={CalendarDays} />
      </section>
      <Card className="bg-card/75 p-5">
        <h2 className="mb-4 text-sm font-semibold">Nuevo evento</h2>
        <form className="grid gap-3 lg:grid-cols-6" onSubmit={createEvent}>
          <Input placeholder="EVENT_ID" value={eventDraft.eventId} onChange={(e) => setEventDraft({ ...eventDraft, eventId: e.target.value })} />
          <Input placeholder="Nombre" value={eventDraft.name} onChange={(e) => setEventDraft({ ...eventDraft, name: e.target.value })} />
          <Input type="date" value={eventDraft.date} onChange={(e) => setEventDraft({ ...eventDraft, date: e.target.value })} />
          <Input type="number" placeholder="Presupuesto" value={eventDraft.budget} onChange={(e) => setEventDraft({ ...eventDraft, budget: e.target.value })} />
          <Select value={eventDraft.status} onChange={(e) => setEventDraft({ ...eventDraft, status: e.target.value })}><option value="PROPOSAL">Propuesta</option><option value="PLANNING">Planeacion</option><option value="ACTIVE">Activo</option><option value="CLOSED">Cerrado</option><option value="CANCELLED">Cancelado</option></Select>
          <Button><Plus className="h-4 w-4" /> Crear</Button>
        </form>
      </Card>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => {
          const income = event.lineItems.filter((line) => line.type === "INCOME" || line.type === "SPONSOR").reduce((sum, line) => sum + Number(line.actual), 0);
          const expense = event.lineItems.filter((line) => line.type === "EXPENSE" || line.type === "PERSONNEL").reduce((sum, line) => sum + Number(line.actual), 0);
          const pending = event.lineItems.filter((line) => line.financialStatus !== "SETTLED").length;
          return (
            <Card key={event.id} className="bg-card/75 p-5 transition hover:-translate-y-0.5 hover:bg-card">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="text-lg font-semibold">{event.name}</h2><p className="mt-1 text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString("es-CO")}</p></div>
                <Select className="w-32" value={event.status} onChange={(e) => updateEventStatus(event.id, e.target.value as EventStatus)}>
                  <option value="PROPOSAL">Propuesta</option>
                  <option value="PLANNING">Planeacion</option>
                  <option value="ACTIVE">Activo</option>
                  <option value="CLOSED">Cerrado</option>
                  <option value="CANCELLED">Cancelado</option>
                </Select>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Presupuesto</p><p className="font-medium">{money(Number(event.budget))}</p></div>
                <div><p className="text-xs text-muted-foreground">Utilidad estimada</p><p className="font-medium">{money(income - expense)}</p></div>
                <div><p className="text-xs text-muted-foreground">Pendientes</p><p className="font-medium">{pending}</p></div>
                <div><p className="text-xs text-muted-foreground">EVENT_ID</p><p className="font-mono text-xs">{event.eventId}</p></div>
              </div>
              <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                <Button asChild><Link href={`/events/${event.slug}`}><DoorOpen className="h-4 w-4" /> Entrar</Link></Button>
                <Button variant="outline" size="icon" aria-label="Eliminar evento" onClick={() => deleteEvent(event.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
