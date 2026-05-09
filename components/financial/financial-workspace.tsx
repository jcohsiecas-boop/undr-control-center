"use client";

import { useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, CircleDollarSign, Plus, Trash2, WalletCards } from "lucide-react";
import { CashFlowChart } from "@/components/dashboard/charts";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { money } from "@/lib/utils";

type BankAccount = {
  id: string;
  name: string;
  bank: string;
  accountNo: string | null;
  currency: string;
  balance: string | number;
};

type FinancialRecord = {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string;
  amount: string | number;
  month: string;
  projected: boolean;
  invoiceStatus: "INVOICED" | "RECEIVABLE" | "PAID" | "VOID";
  taxType: "NONE" | "IVA" | "RENTA";
  taxPaid: boolean;
  bankAccountId: string | null;
  bankAccount?: BankAccount | null;
};

export function FinancialWorkspace({ initialRecords, initialAccounts }: { initialRecords: FinancialRecord[]; initialAccounts: BankAccount[] }) {
  const [records, setRecords] = useState(initialRecords);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [recordDraft, setRecordDraft] = useState({
    type: "INCOME",
    category: "",
    description: "",
    amount: "",
    month: new Date().toISOString().slice(0, 10),
    projected: false,
    invoiceStatus: "PAID",
    taxType: "NONE",
    taxPaid: false,
    bankAccountId: ""
  });
  const [accountDraft, setAccountDraft] = useState({ name: "", bank: "", accountNo: "", balance: "" });

  const totals = useMemo(() => {
    const income = records.filter((r) => r.type === "INCOME").reduce((sum, r) => sum + Number(r.amount), 0);
    const expenses = records.filter((r) => r.type === "EXPENSE").reduce((sum, r) => sum + Number(r.amount), 0);
    const billed = records.filter((r) => r.invoiceStatus === "INVOICED" || r.invoiceStatus === "PAID").reduce((sum, r) => sum + Number(r.amount), 0);
    const receivable = records.filter((r) => r.invoiceStatus === "RECEIVABLE").reduce((sum, r) => sum + Number(r.amount), 0);
    const iva = records.filter((r) => r.taxType === "IVA" && !r.taxPaid).reduce((sum, r) => sum + Number(r.amount) * 0.19, 0);
    const renta = records.filter((r) => r.taxType === "RENTA" && !r.taxPaid).reduce((sum, r) => sum + Number(r.amount) * 0.1, 0);
    return { income, expenses, billed, receivable, iva, renta, utility: income - expenses };
  }, [records]);

  const flow = Object.values(records.reduce<Record<string, { month: string; income: number; expenses: number }>>((acc, record) => {
    const month = new Date(record.month).toISOString().slice(0, 7);
    acc[month] ??= { month, income: 0, expenses: 0 };
    acc[month][record.type === "INCOME" ? "income" : "expenses"] += Number(record.amount);
    return acc;
  }, {})).sort((a, b) => a.month.localeCompare(b.month));

  async function createRecord(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/financial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...recordDraft, bankAccountId: recordDraft.bankAccountId || null, amount: Number(recordDraft.amount), projected: Boolean(recordDraft.projected), taxPaid: Boolean(recordDraft.taxPaid) })
    });
    const created = await response.json();
    setRecords((current) => [created, ...current]);
    const refreshed = await fetch("/api/bank-accounts").then((res) => res.json());
    setAccounts(refreshed);
    setRecordDraft({ ...recordDraft, category: "", description: "", amount: "" });
  }

  async function deleteRecord(id: string) {
    await fetch(`/api/financial/${id}`, { method: "DELETE" });
    setRecords((current) => current.filter((record) => record.id !== id));
    setAccounts(await fetch("/api/bank-accounts").then((res) => res.json()));
  }

  async function clearFinance() {
    await fetch("/api/financial", { method: "DELETE" });
    setRecords([]);
    setAccounts([]);
  }

  async function createAccount(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/bank-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...accountDraft, balance: Number(accountDraft.balance || 0) })
    });
    const account = await response.json();
    setAccounts((current) => [account, ...current]);
    setAccountDraft({ name: "", bank: "", accountNo: "", balance: "" });
  }

  async function updateAccountBalance(id: string, balance: number) {
    const response = await fetch(`/api/bank-accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance })
    });
    const updated = await response.json();
    setAccounts((current) => current.map((account) => (account.id === id ? updated : account)));
  }

  async function deleteAccount(id: string) {
    await fetch(`/api/bank-accounts/${id}`, { method: "DELETE" });
    setAccounts((current) => current.filter((account) => account.id !== id));
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div><Badge tone="red">Dashboard Financiero</Badge><h1 className="mt-3 text-3xl font-semibold">Caja, utilidad, impuestos y bancos</h1></div>
        <Button variant="outline" onClick={clearFinance}><Trash2 className="h-4 w-4" /> Limpiar finanzas</Button>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ingresos" value={money(totals.income)} hint="Ingresos registrados" icon={ArrowUpCircle} />
        <MetricCard label="Egresos" value={money(totals.expenses)} hint="Gastos y salidas" icon={ArrowDownCircle} />
        <MetricCard label="Facturado" value={money(totals.billed)} hint="Facturado o pagado" icon={CircleDollarSign} />
        <MetricCard label="Por cobrar" value={money(totals.receivable)} hint="Pendiente de cobro" icon={WalletCards} />
        <MetricCard label="IVA por pagar" value={money(totals.iva)} hint="Estimado 19%" icon={ArrowDownCircle} />
        <MetricCard label="Renta por pagar" value={money(totals.renta)} hint="Estimado 10%" icon={ArrowDownCircle} />
        <MetricCard label="Utilidad" value={money(totals.utility)} hint="Ingresos menos egresos" icon={CircleDollarSign} />
        <MetricCard label="Bancos" value={money(accounts.reduce((sum, a) => sum + Number(a.balance), 0))} hint="Saldo total en cuentas" icon={WalletCards} />
      </section>

      <Card className="bg-card/75 p-5 backdrop-blur">
        <h2 className="mb-4 text-sm font-semibold">Nuevo movimiento</h2>
        <form className="grid gap-3 lg:grid-cols-4" onSubmit={createRecord}>
          <Select value={recordDraft.type} onChange={(e) => setRecordDraft({ ...recordDraft, type: e.target.value })}><option value="INCOME">Ingreso</option><option value="EXPENSE">Egreso</option></Select>
          <Input placeholder="Categoria" value={recordDraft.category} onChange={(e) => setRecordDraft({ ...recordDraft, category: e.target.value })} />
          <Input placeholder="Descripcion" value={recordDraft.description} onChange={(e) => setRecordDraft({ ...recordDraft, description: e.target.value })} />
          <Input type="number" placeholder="Monto" value={recordDraft.amount} onChange={(e) => setRecordDraft({ ...recordDraft, amount: e.target.value })} />
          <Input type="date" value={recordDraft.month} onChange={(e) => setRecordDraft({ ...recordDraft, month: e.target.value })} />
          <Select value={recordDraft.invoiceStatus} onChange={(e) => setRecordDraft({ ...recordDraft, invoiceStatus: e.target.value })}><option value="PAID">Pagado</option><option value="INVOICED">Facturado</option><option value="RECEIVABLE">Por cobrar</option><option value="VOID">Anulado</option></Select>
          <Select value={recordDraft.taxType} onChange={(e) => setRecordDraft({ ...recordDraft, taxType: e.target.value })}><option value="NONE">Sin impuesto</option><option value="IVA">IVA</option><option value="RENTA">Renta</option></Select>
          <Select value={recordDraft.bankAccountId} onChange={(e) => setRecordDraft({ ...recordDraft, bankAccountId: e.target.value })}><option value="">Sin cuenta</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={recordDraft.projected} onChange={(e) => setRecordDraft({ ...recordDraft, projected: e.target.checked })} /> Proyectado</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={recordDraft.taxPaid} onChange={(e) => setRecordDraft({ ...recordDraft, taxPaid: e.target.checked })} /> Impuesto pagado</label>
          <Button><Plus className="h-4 w-4" /> Agregar</Button>
        </form>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-card/75 p-5 backdrop-blur">
          <h2 className="mb-4 text-sm font-semibold">Cuentas de banco</h2>
          <form className="mb-4 grid gap-2" onSubmit={createAccount}>
            <Input placeholder="Nombre cuenta" value={accountDraft.name} onChange={(e) => setAccountDraft({ ...accountDraft, name: e.target.value })} />
            <Input placeholder="Banco" value={accountDraft.bank} onChange={(e) => setAccountDraft({ ...accountDraft, bank: e.target.value })} />
            <Input placeholder="Numero" value={accountDraft.accountNo} onChange={(e) => setAccountDraft({ ...accountDraft, accountNo: e.target.value })} />
            <Input type="number" placeholder="Saldo inicial" value={accountDraft.balance} onChange={(e) => setAccountDraft({ ...accountDraft, balance: e.target.value })} />
            <Button size="sm">Agregar cuenta</Button>
          </form>
          <div className="space-y-2">{accounts.map((account) => <div key={account.id} className="rounded-md border border-border p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium">{account.name}</p><p className="text-xs text-muted-foreground">{account.bank} · {account.accountNo}</p></div><Button size="sm" variant="outline" onClick={() => deleteAccount(account.id)}><Trash2 className="h-4 w-4" /></Button></div><Input className="mt-2" type="number" value={Number(account.balance)} onChange={(e) => updateAccountBalance(account.id, Number(e.target.value))} /></div>)}</div>
        </Card>
        <CashFlowChart data={flow} />
      </section>

      <Card className="overflow-hidden bg-card/75 backdrop-blur">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Fecha</th><th>Tipo</th><th>Categoria</th><th>Descripcion</th><th>Monto</th><th>Estado</th><th>Impuesto</th><th>Cuenta</th><th></th></tr></thead>
          <tbody>{records.map((record) => <tr key={record.id} className="border-t border-border"><td className="p-3">{new Date(record.month).toISOString().slice(0, 10)}</td><td>{record.type === "INCOME" ? "Ingreso" : "Egreso"}</td><td>{record.category}</td><td>{record.description}</td><td>{money(Number(record.amount))}</td><td><Badge tone={record.invoiceStatus === "RECEIVABLE" ? "amber" : "green"}>{record.invoiceStatus}</Badge></td><td>{record.taxType} {record.taxPaid ? "pagado" : ""}</td><td>{record.bankAccount?.name ?? "-"}</td><td><Button size="sm" variant="outline" onClick={() => deleteRecord(record.id)}><Trash2 className="h-4 w-4" /></Button></td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}
