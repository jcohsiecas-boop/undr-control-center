"use client";

import { useState } from "react";
import { Boxes, Plus, Trash2 } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { money } from "@/lib/utils";

type Asset = { id: string; code: string; name: string; category: "AUDIO" | "LIGHTING" | "BRANDING" | "TECHNOLOGY" | "PRODUCTION"; value: string | number; status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "RETIRED"; location: string; responsible: string };

export function InventoryWorkspace({ initialAssets }: { initialAssets: Asset[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [draft, setDraft] = useState({ code: "", name: "", category: "AUDIO", value: "", status: "AVAILABLE", location: "", responsible: "" });
  async function createAsset(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, value: Number(draft.value || 0) })
    });
    const asset = await response.json();
    setAssets((current) => [asset, ...current]);
    setDraft({ code: "", name: "", category: "AUDIO", value: "", status: "AVAILABLE", location: "", responsible: "" });
  }
  async function deleteAsset(id: string) {
    await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    setAssets((current) => current.filter((asset) => asset.id !== id));
  }
  const value = assets.reduce((sum, asset) => sum + Number(asset.value), 0);
  return (
    <div className="space-y-6">
      <section><Badge tone="red">Inventario</Badge><h1 className="mt-3 text-3xl font-semibold">Audio, luces, branding, tecnologia y produccion</h1></section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Activos" value={`${assets.length}`} hint="Items registrados" icon={Boxes} />
        <MetricCard label="Valor total" value={money(value)} hint="Valor contable estimado" icon={Boxes} />
        <MetricCard label="En uso" value={`${assets.filter((a) => a.status === "IN_USE").length}`} hint="Asignados a operacion" icon={Boxes} />
        <MetricCard label="Mantenimiento" value={`${assets.filter((a) => a.status === "MAINTENANCE").length}`} hint="Requieren intervencion" icon={Boxes} />
      </section>
      <Card className="bg-card/75 p-5">
        <h2 className="mb-4 text-sm font-semibold">Nuevo item</h2>
        <form className="grid gap-3 lg:grid-cols-8" onSubmit={createAsset}>
          <Input placeholder="Codigo" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
          <Input placeholder="Activo" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}><option value="AUDIO">Audio</option><option value="LIGHTING">Luces</option><option value="BRANDING">Branding</option><option value="TECHNOLOGY">Tecnologia</option><option value="PRODUCTION">Produccion</option></Select>
          <Input type="number" placeholder="Valor" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} />
          <Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}><option value="AVAILABLE">Disponible</option><option value="IN_USE">En uso</option><option value="MAINTENANCE">Mantenimiento</option><option value="RETIRED">Retirado</option></Select>
          <Input placeholder="Ubicacion" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
          <Input placeholder="Responsable" value={draft.responsible} onChange={(e) => setDraft({ ...draft, responsible: e.target.value })} />
          <Button><Plus className="h-4 w-4" /> Agregar</Button>
        </form>
      </Card>
      <Card className="overflow-hidden bg-card/75">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Codigo</th><th>Activo</th><th>Categoria</th><th>Valor</th><th>Estado</th><th>Ubicacion</th><th>Responsable</th><th></th></tr></thead>
          <tbody>{assets.map((asset) => <tr key={asset.id} className="border-t border-border"><td className="p-3 font-mono text-xs">{asset.code}</td><td>{asset.name}</td><td>{asset.category}</td><td>{money(Number(asset.value))}</td><td><Badge tone={asset.status === "AVAILABLE" ? "green" : asset.status === "MAINTENANCE" ? "amber" : "blue"}>{asset.status}</Badge></td><td>{asset.location}</td><td>{asset.responsible}</td><td><Button size="sm" variant="outline" onClick={() => deleteAsset(asset.id)}><Trash2 className="h-4 w-4" /></Button></td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}
