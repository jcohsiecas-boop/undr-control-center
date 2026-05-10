import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/api";
import { FinancialWorkspace } from "@/components/financial/financial-workspace";

export default async function FinancialPage() {
  const records = await prisma.financialRecord.findMany({ where: { deletedAt: null }, include: { bankAccount: true, event: true, payments: { include: { bankAccount: true }, orderBy: { paidAt: "desc" } } }, orderBy: { month: "desc" } });
  const accounts = await prisma.bankAccount.findMany({ orderBy: { updatedAt: "desc" } });
  const categories = await prisma.financialCategory.findMany({ orderBy: { name: "asc" } });
  const events = await prisma.event.findMany({ orderBy: { date: "desc" } });
  return <FinancialWorkspace initialRecords={serialize(records)} initialAccounts={serialize(accounts)} initialCategories={serialize(categories)} events={serialize(events)} />;
}
