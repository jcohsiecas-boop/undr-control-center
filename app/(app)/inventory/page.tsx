import { Boxes, MapPin, ShieldCheck, Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/utils";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default async function InventoryPage() {
  const assets = await prisma.inventory.findMany({ orderBy: { category: "asc" } });
  const value = assets.reduce((sum, asset) => sum + Number(asset.value), 0);
  return (
    <div className="space-y-6">
      <section><Badge tone="red">Inventario</Badge><h1 className="mt-3 text-3xl font-semibold">Audio, luces, branding, tecnologia y produccion</h1></section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Activos" value={`${assets.length}`} hint="Items registrados" icon={Boxes} />
        <MetricCard label="Valor total" value={money(value)} hint="Valor contable estimado" icon={ShieldCheck} />
        <MetricCard label="En uso" value={`${assets.filter((a) => a.status === "IN_USE").length}`} hint="Asignados a operacion" icon={MapPin} />
        <MetricCard label="Mantenimiento" value={`${assets.filter((a) => a.status === "MAINTENANCE").length}`} hint="Requieren intervencion" icon={Wrench} />
      </section>
      <Card className="overflow-hidden bg-card/75 backdrop-blur">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Codigo</th><th>Activo</th><th>Categoria</th><th>Valor</th><th>Estado</th><th>Ubicacion</th><th>Responsable</th></tr></thead>
          <tbody>{assets.map((asset) => <tr key={asset.id} className="border-t border-border"><td className="p-3 font-mono text-xs">{asset.code}</td><td className="font-medium">{asset.name}</td><td>{asset.category}</td><td>{money(Number(asset.value))}</td><td><Badge tone={asset.status === "AVAILABLE" ? "green" : asset.status === "MAINTENANCE" ? "amber" : "blue"}>{asset.status}</Badge></td><td>{asset.location}</td><td>{asset.responsible}</td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}
