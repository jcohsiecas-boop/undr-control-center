import { HandCoins, Landmark, Scale, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/utils";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default async function PartnersPage() {
  const partners = await prisma.partner.findMany({ orderBy: { participation: "desc" } });
  const contribution = partners.reduce((sum, partner) => sum + Number(partner.contribution), 0);
  const withdrawals = partners.reduce((sum, partner) => sum + Number(partner.withdrawals), 0);
  const loans = partners.reduce((sum, partner) => sum + Number(partner.loans), 0);
  return (
    <div className="space-y-6">
      <section><Badge tone="red">Socios</Badge><h1 className="mt-3 text-3xl font-semibold">Participacion, aportes, retiros y prestamos</h1></section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Socios activos" value={`${partners.filter((p) => p.type === "ACTIVE").length}`} hint="Participan en operacion" icon={Users} />
        <MetricCard label="Aportes" value={money(contribution)} hint="Capital aportado" icon={HandCoins} />
        <MetricCard label="Retiros" value={money(withdrawals)} hint="Retiros acumulados" icon={Landmark} />
        <MetricCard label="Prestamos" value={money(loans)} hint="Obligaciones con socios" icon={Scale} />
      </section>
      <Card className="overflow-hidden bg-card/75 backdrop-blur">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Socio</th><th>Tipo</th><th>Aportes</th><th>Retiros</th><th>Prestamos</th><th>Participacion</th></tr></thead>
          <tbody>{partners.map((partner) => <tr key={partner.id} className="border-t border-border"><td className="p-3 font-medium">{partner.name}</td><td><Badge tone={partner.type === "ACTIVE" ? "green" : "blue"}>{partner.type}</Badge></td><td>{money(Number(partner.contribution))}</td><td>{money(Number(partner.withdrawals))}</td><td>{money(Number(partner.loans))}</td><td>{Number(partner.participation).toFixed(1)}%</td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}
