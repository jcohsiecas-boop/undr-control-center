import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/api";
import { FinancialWorkspace } from "@/components/financial/financial-workspace";

export default async function FinancialPage() {
  const records = await prisma.financialRecord.findMany({ include: { bankAccount: true }, orderBy: { month: "desc" } });
  const accounts = await prisma.bankAccount.findMany({ orderBy: { updatedAt: "desc" } });
  return <FinancialWorkspace initialRecords={serialize(records)} initialAccounts={serialize(accounts)} />;
}
