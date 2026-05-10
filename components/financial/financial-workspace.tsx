"use client";

import { useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, ChevronDown, CircleDollarSign, Plus, Trash2, WalletCards } from "lucide-react";
import { CashFlowChart } from "@/components/dashboard/charts";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { money } from "@/lib/utils";

type FinancialType = "INCOME" | "EXPENSE";
type DocumentStatus = "PROJECTED" | "CONFIRMED" | "INVOICED" | "PARTIALLY_COLLECTED" | "COLLECTED" | "VOID" | "APPROVED" | "COMMITTED" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
type PaymentStatus = "PENDING" | "PARTIAL" | "SETTLED";

type BankAccount = { id: string; name: string; bank: string; accountNo: string | null; currency: string; balance: string | number };
type Category = { id: string; name: string; type: FinancialType };
type EventOption = { id: string; name: string; eventId: string };
type Payment = { id: string; amount: string | number; paidAt: string; note: string | null; bankAccount: BankAccount };
type FinancialRecord = {
  id: string;
  type: FinancialType;
  category: string;
  description: string;
  amount: string | number;
  month: string;
  documentStatus: DocumentStatus;
  paymentStatus: PaymentStatus;
  paidAmount: string | number;
  pendingBalance: string | number;
  dueDate: string | null;
  responsible: string | null;
  taxType: "NONE" | "IVA" | "RENTA";
  taxPaid: boolean;
  bankAccountId: string | null;
  bankAccount?: BankAccount | null;
  event?: EventOption | null;
  payments: Payment[];
};

const incomeStatuses: DocumentStatus[] = ["PROJECTED", "CONFIRMED", "INVOICED", "PARTIALLY_COLLECTED", "COLLECTED", "VOID"];
const expenseStatuses: DocumentStatus[] = ["PROJECTED", "APPROVED", "COMMITTED", "PARTIALLY_PAID", "PAID", "CANCELLED"];
const statusLabel: Record<DocumentStatus | PaymentStatus, string> = {
  PROJECTED: "Proyectado",
  CONFIRMED: "Confirmado",
  INVOICED: "Facturado",
  PARTIALLY_COLLECTED: "Parcialmente cobrado",
  COLLECTED: "Cobrado",
  VOID: "Anulado",
  APPROVED: "Aprobado",
  COMMITTED: "Comprometido",
  PARTIALLY_PAID: "Parcialmente pagado",
  PAID: "Pagado",
  CANCELLED: "Cancelado",
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  SETTLED: "Liquidado"
};

export function FinancialWorkspace({
  initialRecords,
  initialAccounts,
  initialCategories,
  events
}: {
  initialRecords: FinancialRecord[];
  initialAccounts: BankAccount[];
  initialCategories: Category[];
  events: EventOption[];
}) {
  const [records, setRecords] = useState(initialRecords);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [categories, setCategories] = useState(initialCategories);
  const [showBankForm, setShowBankForm] = useState(false);
  const [chartFilters, setChartFilters] = useState({ bankAccountId: "ALL", from: "", to: "" });
  const [tableFilter, setTableFilter] = useState("ACTIVE");
  const [paymentDrafts, setPaymentDrafts] = useState<Record<string, { amount: string; bankAccountId: string; note: string }>>({});
  const [categoryDraft, setCategoryDraft] = useState("");
  const [recordDraft, setRecordDraft] = useState({
    type: "INCOME" as FinancialType,
    category: "",
    description: "",
    amount: "",
    month: new Date().toISOString().slice(0, 10),
    documentStatus: "INVOICED" as DocumentStatus,
    dueDate: "",
    responsible: "",
    eventId: "",
    taxType: "NONE",
    taxPaid: false
  });
  const [accountDraft, setAccountDraft] = useState({ name: "", bank: "", accountNo: "", balance: "" });

  const visibleCategories = categories.filter((category) => category.type === recordDraft.type);
  const tableRecords = records.filter((record) => {
    if (tableFilter === "PROJECTED") return record.documentStatus === "PROJECTED";
    if (tableFilter === "REAL") return Number(record.paidAmount) > 0;
    if (tableFilter === "CANCELLED") return ["CANCELLED", "VOID"].includes(record.documentStatus);
    return !["CANCELLED", "VOID"].includes(record.documentStatus);
  });
  const receivables = records.filter((r) => r.type === "INCOME" && Number(r.pendingBalance) > 0 && !["VOID", "CANCELLED"].includes(r.documentStatus));
  const payables = records.filter((r) => r.type === "EXPENSE" && Number(r.pendingBalance) > 0 && !["VOID", "CANCELLED"].includes(r.documentStatus));

  const totals = useMemo(() => {
    const realIncome = records.filter((r) => r.type === "INCOME").reduce((sum, r) => sum + Number(r.paidAmount), 0);
    const realExpense = records.filter((r) => r.type === "EXPENSE").reduce((sum, r) => sum + Number(r.paidAmount), 0);
    const projectedIncome = records.filter((r) => r.type === "INCOME").reduce((sum, r) => sum + Number(r.amount), 0);
    const projectedExpense = records.filter((r) => r.type === "EXPENSE").reduce((sum, r) => sum + Number(r.amount), 0);
    const billed = records.filter((r) => r.type === "INCOME" && ["INVOICED", "PARTIALLY_COLLECTED", "COLLECTED"].includes(r.documentStatus)).reduce((sum, r) => sum + Number(r.amount), 0);
    const committed = records.filter((r) => r.type === "EXPENSE" && ["COMMITTED", "PARTIALLY_PAID", "PAID"].includes(r.documentStatus)).reduce((sum, r) => sum + Number(r.amount), 0);
    const iva = records.filter((r) => r.taxType === "IVA" && !r.taxPaid).reduce((sum, r) => sum + Number(r.pendingBalance) * 0.19, 0);
    const renta = records.filter((r) => r.taxType === "RENTA" && !r.taxPaid).reduce((sum, r) => sum + Number(r.pendingBalance) * 0.1, 0);
    return { realIncome, realExpense, projectedIncome, projectedExpense, billed, committed, iva, renta };
  }, [records]);

  const chartRecords = records.filter((record) => {
    const date = new Date(record.month).toISOString().slice(0, 10);
    return (
      (chartFilters.bankAccountId === "ALL" || record.bankAccountId === chartFilters.bankAccountId || record.payments.some((payment) => payment.bankAccount.id === chartFilters.bankAccountId)) &&
      (!chartFilters.from || date >= chartFilters.from) &&
      (!chartFilters.to || date <= chartFilters.to)
    );
  });
  const flow = Object.values(chartRecords.reduce<Record<string, { month: string; income: number; expenses: number }>>((acc, record) => {
    const month = new Date(record.month).toISOString().slice(0, 7);
    acc[month] ??= { month, income: 0, expenses: 0 };
    acc[month][record.type === "INCOME" ? "income" : "expenses"] += Number(record.paidAmount);
    return acc;
  }, {})).sort((a, b) => a.month.localeCompare(b.month));

  async function createCategory() {
    if (!categoryDraft.trim()) return;
    const response = await fetch("/api/financial-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: categoryDraft.trim(), type: recordDraft.type })
    });
    const category = await response.json();
    setCategories((current) => current.some((item) => item.id === category.id) ? current : [...current, category]);
    setRecordDraft((current) => ({ ...current, category: category.name }));
    setCategoryDraft("");
  }

  async function createRecord(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/financial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...recordDraft, amount: Number(recordDraft.amount), dueDate: recordDraft.dueDate || null, eventId: recordDraft.eventId || null })
    });
    const created = await response.json();
    setRecords((current) => [created, ...current]);
    setRecordDraft({ ...recordDraft, description: "", amount: "", responsible: "" });
  }

  async function updateRecord(id: string, patch: Partial<FinancialRecord>) {
    const response = await fetch(`/api/financial/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    const updated = await response.json();
    setRecords((current) => current.map((record) => (record.id === id ? updated : record)));
  }

  async function deleteRecord(id: string) {
    await fetch(`/api/financial/${id}`, { method: "DELETE" });
    setRecords((current) => current.filter((record) => record.id !== id));
  }

  async function addPayment(record: FinancialRecord) {
    const draft = paymentDrafts[record.id];
    if (!draft?.amount || !draft.bankAccountId) return;
    const response = await fetch(`/api/financial/${record.id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });
    const updated = await response.json();
    setRecords((current) => current.map((item) => (item.id === record.id ? updated : item)));
    setAccounts(await fetch("/api/bank-accounts").then((res) => res.json()));
    setPaymentDrafts((current) => ({ ...current, [record.id]: { amount: "", bankAccountId: "", note: "" } }));
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
    setShowBankForm(false);
  }

  async function updateAccountBalance(id: string, balance: number) {
    const response = await fetch(`/api/bank-accounts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ balance }) });
    const updated = await response.json();
    setAccounts((current) => current.map((account) => (account.id === id ? updated : account)));
  }

  async function deleteAccount(id: string) {
    await fetch(`/api/bank-accounts/${id}`, { method: "DELETE" });
    setAccounts((current) => current.filter((account) => account.id !== id));
  }

  return (
    <div className="space-y-6">
      <section><Badge tone="red">Dashboard Financiero</Badge><h1 className="mt-3 text-3xl font-semibold">Contabilidad devengada, cartera y caja real</h1></section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total por cobrar" value={money(receivables.reduce((s, r) => s + Number(r.pendingBalance), 0))} hint="Ingresos no cobrados" icon={WalletCards} />
        <MetricCard label="Total por pagar" value={money(payables.reduce((s, r) => s + Number(r.pendingBalance), 0))} hint="Egresos no pagados" icon={ArrowDownCircle} />
        <MetricCard label="Flujo real" value={money(totals.realIncome - totals.realExpense)} hint="Solo pagos/cobros reales" icon={CircleDollarSign} />
        <MetricCard label="Flujo proyectado" value={money(totals.projectedIncome - totals.projectedExpense)} hint="Devengado total" icon={CircleDollarSign} />
        <MetricCard label="Ingresos facturados" value={money(totals.billed)} hint="Documento emitido" icon={ArrowUpCircle} />
        <MetricCard label="Gastos comprometidos" value={money(totals.committed)} hint="Obligaciones asumidas" icon={ArrowDownCircle} />
        <MetricCard label="IVA pendiente" value={money(totals.iva)} hint="Sobre saldo pendiente" icon={ArrowDownCircle} />
        <MetricCard label="Renta pendiente" value={money(totals.renta)} hint="Sobre saldo pendiente" icon={ArrowDownCircle} />
      </section>

      <Card className="bg-card/75 p-5">
        <h2 className="mb-4 text-sm font-semibold">Nuevo movimiento devengado</h2>
        <form className="grid gap-3 lg:grid-cols-4" onSubmit={createRecord}>
          <Select value={recordDraft.type} onChange={(e) => setRecordDraft({ ...recordDraft, type: e.target.value as FinancialType, category: "", documentStatus: e.target.value === "INCOME" ? "INVOICED" : "APPROVED" })}><option value="INCOME">Ingreso</option><option value="EXPENSE">Egreso</option></Select>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Select value={recordDraft.category} onChange={(e) => setRecordDraft({ ...recordDraft, category: e.target.value })}><option value="">Categoria</option>{visibleCategories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</Select>
            <Button type="button" variant="outline" onClick={createCategory}><Plus className="h-4 w-4" /></Button>
          </div>
          <Input placeholder="Nueva categoria" value={categoryDraft} onChange={(e) => setCategoryDraft(e.target.value)} />
          <Input placeholder="Descripcion" value={recordDraft.description} onChange={(e) => setRecordDraft({ ...recordDraft, description: e.target.value })} />
          <Input type="number" placeholder="Monto" value={recordDraft.amount} onChange={(e) => setRecordDraft({ ...recordDraft, amount: e.target.value })} />
          <Input type="date" value={recordDraft.month} onChange={(e) => setRecordDraft({ ...recordDraft, month: e.target.value })} />
          <Input type="date" value={recordDraft.dueDate} onChange={(e) => setRecordDraft({ ...recordDraft, dueDate: e.target.value })} />
          <Select value={recordDraft.documentStatus} onChange={(e) => setRecordDraft({ ...recordDraft, documentStatus: e.target.value as DocumentStatus })}>{(recordDraft.type === "INCOME" ? incomeStatuses : expenseStatuses).map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}</Select>
          <Select value={recordDraft.taxType} onChange={(e) => setRecordDraft({ ...recordDraft, taxType: e.target.value })}><option value="NONE">Sin impuesto</option><option value="IVA">IVA</option><option value="RENTA">Renta</option></Select>
          <Select value={recordDraft.eventId} onChange={(e) => setRecordDraft({ ...recordDraft, eventId: e.target.value })}><option value="">Sin evento</option>{events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</Select>
          <Input placeholder="Responsable" value={recordDraft.responsible} onChange={(e) => setRecordDraft({ ...recordDraft, responsible: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={recordDraft.taxPaid} onChange={(e) => setRecordDraft({ ...recordDraft, taxPaid: e.target.checked })} /> Impuesto pagado</label>
          <Button><Plus className="h-4 w-4" /> Agregar</Button>
        </form>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-card/75 p-5">
          <button className="mb-4 flex w-full items-center justify-between text-sm font-semibold" onClick={() => setShowBankForm((value) => !value)}>Cuentas de banco <ChevronDown className="h-4 w-4" /></button>
          {showBankForm && <form className="mb-4 grid gap-2" onSubmit={createAccount}><Input placeholder="Nombre cuenta" value={accountDraft.name} onChange={(e) => setAccountDraft({ ...accountDraft, name: e.target.value })} /><Input placeholder="Banco" value={accountDraft.bank} onChange={(e) => setAccountDraft({ ...accountDraft, bank: e.target.value })} /><Input placeholder="Numero" value={accountDraft.accountNo} onChange={(e) => setAccountDraft({ ...accountDraft, accountNo: e.target.value })} /><Input type="number" placeholder="Saldo inicial" value={accountDraft.balance} onChange={(e) => setAccountDraft({ ...accountDraft, balance: e.target.value })} /><Button size="sm">Agregar cuenta</Button></form>}
          <div className="space-y-2">{accounts.map((account) => <div key={account.id} className="rounded-md border border-border p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium">{account.name}</p><p className="text-xs text-muted-foreground">{account.bank} · {account.accountNo}</p></div><Button size="sm" variant="outline" onClick={() => deleteAccount(account.id)}><Trash2 className="h-4 w-4" /></Button></div><Input className="mt-2" type="number" value={Number(account.balance)} onChange={(e) => updateAccountBalance(account.id, Number(e.target.value))} /></div>)}</div>
        </Card>
        <Card className="bg-card/75 p-5">
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <Select value={chartFilters.bankAccountId} onChange={(event) => setChartFilters({ ...chartFilters, bankAccountId: event.target.value })}>
              <option value="ALL">Todas las cuentas</option>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </Select>
            <Input type="date" value={chartFilters.from} onChange={(event) => setChartFilters({ ...chartFilters, from: event.target.value })} />
            <Input type="date" value={chartFilters.to} onChange={(event) => setChartFilters({ ...chartFilters, to: event.target.value })} />
          </div>
          <CashFlowChart data={flow} />
        </Card>
      </section>

      <ReceivableTable title="Cuentas por cobrar" records={receivables} accounts={accounts} paymentDrafts={paymentDrafts} setPaymentDrafts={setPaymentDrafts} addPayment={addPayment} cancelRecord={deleteRecord} />
      <ReceivableTable title="Cuentas por pagar" records={payables} accounts={accounts} paymentDrafts={paymentDrafts} setPaymentDrafts={setPaymentDrafts} addPayment={addPayment} cancelRecord={deleteRecord} />

      <Card className="overflow-hidden bg-card/75">
        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold">Movimientos financieros</h2>
          <Select className="w-full md:w-64" value={tableFilter} onChange={(event) => setTableFilter(event.target.value)}>
            <option value="ACTIVE">Activos</option>
            <option value="PROJECTED">Solo proyectados</option>
            <option value="REAL">Con pago/cobro real</option>
            <option value="CANCELLED">Anulados / cancelados</option>
          </Select>
        </div>
        <table className="w-full min-w-[1300px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Fecha</th><th>Tipo</th><th>Categoria</th><th>Descripcion</th><th>Monto</th><th>Doc.</th><th>Pago</th><th>Pagado</th><th>Pendiente</th><th>Vence</th><th>Responsable</th><th></th></tr></thead>
          <tbody>{tableRecords.map((record) => <tr key={record.id} className="border-t border-border"><td className="p-3">{new Date(record.month).toISOString().slice(0, 10)}</td><td>{record.type === "INCOME" ? "Ingreso" : "Egreso"}</td><td>{record.category}</td><td>{record.description}</td><td>{money(Number(record.amount))}</td><td><Select value={record.documentStatus} onChange={(e) => updateRecord(record.id, { documentStatus: e.target.value as DocumentStatus })}>{(record.type === "INCOME" ? incomeStatuses : expenseStatuses).map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}</Select></td><td><Badge tone={record.paymentStatus === "SETTLED" ? "green" : record.paymentStatus === "PARTIAL" ? "amber" : "red"}>{statusLabel[record.paymentStatus]}</Badge></td><td>{money(Number(record.paidAmount))}</td><td>{money(Number(record.pendingBalance))}</td><td>{record.dueDate ? new Date(record.dueDate).toISOString().slice(0, 10) : "-"}</td><td>{record.responsible ?? "-"}</td><td><Button size="sm" variant="outline" onClick={() => deleteRecord(record.id)}><Trash2 className="h-4 w-4" /> Eliminar</Button></td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}

function ReceivableTable({ title, records, accounts, paymentDrafts, setPaymentDrafts, addPayment, cancelRecord }: { title: string; records: FinancialRecord[]; accounts: BankAccount[]; paymentDrafts: Record<string, { amount: string; bankAccountId: string; note: string }>; setPaymentDrafts: React.Dispatch<React.SetStateAction<Record<string, { amount: string; bankAccountId: string; note: string }>>>; addPayment: (record: FinancialRecord) => void; cancelRecord: (id: string) => void }) {
  return (
    <Card className="overflow-hidden bg-card/75">
      <div className="flex items-center justify-between p-4"><h2 className="text-sm font-semibold">{title}</h2><Badge tone="amber">{money(records.reduce((sum, record) => sum + Number(record.pendingBalance), 0))}</Badge></div>
      <table className="w-full min-w-[1100px] text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Fecha</th><th>Responsable</th><th>Evento</th><th>Monto</th><th>Pendiente</th><th>Dias vencidos</th><th>Estado</th><th>Registrar pago/cobro</th><th></th></tr></thead>
        <tbody>{records.map((record) => { const overdue = record.dueDate ? Math.max(Math.floor((Date.now() - new Date(record.dueDate).getTime()) / 86400000), 0) : 0; const draft = paymentDrafts[record.id] ?? { amount: "", bankAccountId: "", note: "" }; return <tr key={record.id} className="border-t border-border"><td className="p-3">{new Date(record.month).toISOString().slice(0, 10)}</td><td>{record.responsible ?? "-"}</td><td>{record.event?.name ?? "-"}</td><td>{money(Number(record.amount))}</td><td>{money(Number(record.pendingBalance))}</td><td>{overdue}</td><td><Badge tone={record.paymentStatus === "PARTIAL" ? "amber" : "red"}>{statusLabel[record.documentStatus]}</Badge></td><td><div className="grid min-w-[420px] grid-cols-[1fr_1fr_auto] gap-2"><Input type="number" placeholder="Monto" value={draft.amount} onChange={(e) => setPaymentDrafts((current) => ({ ...current, [record.id]: { ...draft, amount: e.target.value } }))} /><Select value={draft.bankAccountId} onChange={(e) => setPaymentDrafts((current) => ({ ...current, [record.id]: { ...draft, bankAccountId: e.target.value } }))}><option value="">Cuenta</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</Select><Button size="sm" onClick={() => addPayment(record)}>Aplicar</Button></div></td><td><Button size="sm" variant="outline" onClick={() => cancelRecord(record.id)}><Trash2 className="h-4 w-4" /></Button></td></tr>; })}</tbody>
      </table>
    </Card>
  );
}
