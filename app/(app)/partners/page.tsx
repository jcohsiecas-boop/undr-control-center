import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/api";
import { PartnersWorkspace } from "@/components/partners/partners-workspace";

export default async function PartnersPage() {
  const partners = await prisma.partner.findMany({ orderBy: { participation: "desc" } });
  const records = await prisma.financialRecord.findMany();
  const utility = records.reduce((sum, r) => sum + (r.type === "INCOME" ? Number(r.amount) : -Number(r.amount)), 0);
  return <PartnersWorkspace initialPartners={serialize(partners)} utility={utility} />;
}
