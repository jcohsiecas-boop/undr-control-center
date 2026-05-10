"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { money } from "@/lib/utils";

type Line = { id: string; type: "INCOME" | "EXPENSE" | "PERSONNEL" | "SPONSOR"; concept: string; quantity: number; unitCost: string | number; projected: string | number; actual: string | number; responsible: string | null; financialStatus: "PENDING" | "PARTIAL" | "SETTLED"; actionedAt: string | null; actionedBy?: { name: string | null; email: string } | null };
type EventDetail = { id: string; eventId: string; slug: string; name: string; date: string; budget: string | number; status: "PLANNING" | "ACTIVE" | "CLOSED" | "CANCELLED"; lineItems: Line[] };

const statusLabel = { PLANNING: "Planeacion", ACTIVE: "Activo", CLOSED: "Cerrado", CANCELLED: "Cancelado" };

export function EventDetailWorkspace({ initialEvent }: { initialEvent: EventDetail }) {
  const [event, setEvent] = useState(initialEvent);
  const [lineDraft, setLineDraft] = useState({ type: "EXPENSE", concept: "", quantity: "1", unitCost: "", responsible: "" });
  const incomeLines = event.lineItems.filter((line) => line.type === "INCOME" || line.type === "SPONSOR");
  const expenseLines = event.lineItems.filter((line) => line.type === "EXPENSE" || line.type === "PERSONNEL");
  const actualIncome = incomeLines.reduce((sum, line) => sum + Number(line.actual), 0);
  const actualExpense = expenseLines.reduce((sum, line) => sum + Number(line.actual), 0);
  const projectedIncome = incomeLines.reduce((sum, line) => sum + Number(line.projected), 0);
  const projectedExpense = expenseLines.reduce((sum, line) => sum + Number(line.projected), 0);

  async function createLine(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    const response = await fetch(`/api/events/${event.id}/line-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lineDraft, quantity: Number(lineDraft.quantity || 1), unitCost: Number(lineDraft.unitCost || 0) })
    });
    const item = await response.json();
    setEvent((current) => ({ ...current, lineItems: [item, ...current.lineItems] }));
    setLineDraft({ type: "EXPENSE", concept: "", quantity: "1", unitCost: "", responsible: "" });
  }

  async function updateLine(id: string, patch: Partial<Line> & { actioned?: boolean }) {
    const response = await fetch(`/api/event-line-items/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const updated = await response.json();
    setEvent((current) => ({ ...current, lineItems: current.lineItems.map((line) => (line.id === id ? updated : line)) }));
  }

  async function deleteLine(id: string) {
    await fetch(`/api/event-line-items/${id}`, { method: "DELETE" });
    setEvent((current) => ({ ...current, lineItems: current.lineItems.filter((line) => line.id !== id) }));
  }

  return (
    <div className="space-y-6">
      <Link href="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Eventos</Link>
      <section className="rounded-lg border border-border bg-card/75 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div><Badge tone="red">{statusLabel[event.status]}</Badge><h1 className="mt-3 text-3xl font-semibold">{event.name}</h1><p className="mt-2 text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString("es-CO")} · {event.eventId}</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Presupuesto total" value={money(Number(event.budget))} />
            <Stat label="Utilidad actual" value={money(actualIncome - actualExpense)} />
            <Stat label="Ingresos reales" value={money(actualIncome)} />
            <Stat label="Egresos reales" value={money(actualExpense)} />
          </div>
        </div>
      </section>
      <Card className="bg-card/75 p-5">
        <h2 className="mb-4 text-sm font-semibold">Nuevo registro</h2>
        <form className="grid gap-3 lg:grid-cols-6" onSubmit={createLine}>
          <Select value={lineDraft.type} onChange={(e) => setLineDraft({ ...lineDraft, type: e.target.value })}><option value="INCOME">Ingreso</option><option value="SPONSOR">Sponsor</option><option value="EXPENSE">Egreso</option><option value="PERSONNEL">Personal</option></Select>
          <Input placeholder="Concepto" value={lineDraft.concept} onChange={(e) => setLineDraft({ ...lineDraft, concept: e.target.value })} />
          <Input type="number" placeholder="Cantidad" value={lineDraft.quantity} onChange={(e) => setLineDraft({ ...lineDraft, quantity: e.target.value })} />
          <Input type="number" placeholder="Costo unitario" value={lineDraft.unitCost} onChange={(e) => setLineDraft({ ...lineDraft, unitCost: e.target.value })} />
          <Input placeholder="Responsable" value={lineDraft.responsible} onChange={(e) => setLineDraft({ ...lineDraft, responsible: e.target.value })} />
          <Button><Plus className="h-4 w-4" /> Agregar</Button>
        </form>
      </Card>
      <section className="grid gap-4 xl:grid-cols-2">
        <LineTable title="Ingresos" lines={incomeLines} actionLabel="Por cobrar" doneLabel="Cobrado" doneTone="green" projected={projectedIncome} actual={actualIncome} updateLine={updateLine} deleteLine={deleteLine} />
        <LineTable title="Egresos" lines={expenseLines} actionLabel="Por pagar" doneLabel="Pagado" doneTone="red" projected={projectedExpense} actual={actualExpense} updateLine={updateLine} deleteLine={deleteLine} />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-border bg-background/40 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>;
}

function LineTable({ title, lines, actionLabel, doneLabel, doneTone, projected, actual, updateLine, deleteLine }: { title: string; lines: Line[]; actionLabel: string; doneLabel: string; doneTone: "green" | "red"; projected: number; actual: number; updateLine: (id: string, patch: Partial<Line> & { actioned?: boolean }) => void; deleteLine: (id: string) => void }) {
  return (
    <Card className="overflow-hidden bg-card/75">
      <div className="flex items-center justify-between gap-3 p-4"><div><h2 className="text-sm font-semibold">{title}</h2><p className="text-xs text-muted-foreground">Proyectado {money(projected)} · Real {money(actual)}</p></div><Badge>{lines.length}</Badge></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Concepto</th><th>Cantidad</th><th>Costo unitario</th><th>Proyectado</th><th>Real</th><th>Responsable</th><th>Estado financiero</th><th></th></tr></thead>
          <tbody>{lines.map((line) => <tr key={line.id} className="border-t border-border"><td className="p-3">{line.concept || "-"}</td><td>{line.quantity}</td><td>{money(Number(line.unitCost))}</td><td>{money(Number(line.projected))}</td><td><Input className="w-28" type="number" value={Number(line.actual)} onChange={(e) => updateLine(line.id, { actual: e.target.value })} /></td><td>{line.responsible ?? "-"}</td><td>{line.financialStatus === "SETTLED" ? <Badge tone={doneTone}><CheckCircle2 className="mr-1 h-3 w-3" /> {doneLabel}</Badge> : <Button size="sm" variant="secondary" onClick={() => updateLine(line.id, { actioned: true })}>{actionLabel}</Button>}<p className="mt-1 text-[10px] text-muted-foreground">{line.actionedAt ? `${line.actionedBy?.name ?? line.actionedBy?.email ?? "Usuario"} · ${new Date(line.actionedAt).toLocaleString("es-CO")}` : ""}</p></td><td><Button size="sm" variant="outline" onClick={() => deleteLine(line.id)}><Trash2 className="h-4 w-4" /></Button></td></tr>)}</tbody>
        </table>
      </div>
    </Card>
  );
}
