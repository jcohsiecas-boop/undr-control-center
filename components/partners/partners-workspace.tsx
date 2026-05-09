"use client";

import { useState } from "react";
import { HandCoins, Plus, Trash2, Users } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { money } from "@/lib/utils";

type Partner = { id: string; name: string; type: "ACTIVE" | "PASSIVE"; contribution: string | number; withdrawals: string | number; loans: string | number; participation: string | number };

export function PartnersWorkspace({ initialPartners, utility }: { initialPartners: Partner[]; utility: number }) {
  const [partners, setPartners] = useState(initialPartners);
  const [draft, setDraft] = useState({ name: "", type: "ACTIVE", contribution: "", withdrawals: "0", loans: "0", participation: "" });
  async function createPartner(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, contribution: Number(draft.contribution || 0), withdrawals: Number(draft.withdrawals || 0), loans: Number(draft.loans || 0), participation: Number(draft.participation || 0) })
    });
    const partner = await response.json();
    setPartners((current) => [partner, ...current]);
    setDraft({ name: "", type: "ACTIVE", contribution: "", withdrawals: "0", loans: "0", participation: "" });
  }
  async function deletePartner(id: string) {
    await fetch(`/api/partners/${id}`, { method: "DELETE" });
    setPartners((current) => current.filter((partner) => partner.id !== id));
  }
  const contribution = partners.reduce((sum, p) => sum + Number(p.contribution), 0);
  const withdrawals = partners.reduce((sum, p) => sum + Number(p.withdrawals), 0);
  return (
    <div className="space-y-6">
      <section><Badge tone="red">Socios</Badge><h1 className="mt-3 text-3xl font-semibold">Participacion, utilidad, aportes y prestamos</h1></section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Socios activos" value={`${partners.filter((p) => p.type === "ACTIVE").length}`} hint="Participan en operacion" icon={Users} />
        <MetricCard label="Aportes" value={money(contribution)} hint="Capital aportado" icon={HandCoins} />
        <MetricCard label="Retiros" value={money(withdrawals)} hint="Retiros acumulados" icon={HandCoins} />
        <MetricCard label="Utilidad distribuible" value={money(utility)} hint="Segun finanzas" icon={HandCoins} />
      </section>
      <Card className="bg-card/75 p-5">
        <h2 className="mb-4 text-sm font-semibold">Nuevo socio</h2>
        <form className="grid gap-3 lg:grid-cols-7" onSubmit={createPartner}>
          <Input placeholder="Nombre" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}><option value="ACTIVE">Activo</option><option value="PASSIVE">Pasivo</option></Select>
          <Input type="number" placeholder="Aportes" value={draft.contribution} onChange={(e) => setDraft({ ...draft, contribution: e.target.value })} />
          <Input type="number" placeholder="Retiros" value={draft.withdrawals} onChange={(e) => setDraft({ ...draft, withdrawals: e.target.value })} />
          <Input type="number" placeholder="Prestamos" value={draft.loans} onChange={(e) => setDraft({ ...draft, loans: e.target.value })} />
          <Input type="number" placeholder="% Participacion" value={draft.participation} onChange={(e) => setDraft({ ...draft, participation: e.target.value })} />
          <Button><Plus className="h-4 w-4" /> Agregar</Button>
        </form>
      </Card>
      <Card className="overflow-hidden bg-card/75">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Socio</th><th>Tipo</th><th>Aportes</th><th>Retiros</th><th>Prestamos</th><th>Participacion</th><th>Utilidad</th><th></th></tr></thead>
          <tbody>{partners.map((partner) => <tr key={partner.id} className="border-t border-border"><td className="p-3 font-medium">{partner.name}</td><td><Badge tone={partner.type === "ACTIVE" ? "green" : "blue"}>{partner.type}</Badge></td><td>{money(Number(partner.contribution))}</td><td>{money(Number(partner.withdrawals))}</td><td>{money(Number(partner.loans))}</td><td>{Number(partner.participation).toFixed(1)}%</td><td>{money(utility * (Number(partner.participation) / 100))}</td><td><Button size="sm" variant="outline" onClick={() => deletePartner(partner.id)}><Trash2 className="h-4 w-4" /></Button></td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}
