CREATE TYPE "InvoiceStatus" AS ENUM ('INVOICED', 'RECEIVABLE', 'PAID', 'VOID');
CREATE TYPE "TaxType" AS ENUM ('NONE', 'IVA', 'RENTA');
CREATE TYPE "EventLineType" AS ENUM ('INCOME', 'EXPENSE', 'PERSONNEL', 'SPONSOR');

CREATE TABLE "bank_accounts" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "bank" TEXT NOT NULL,
  "accountNo" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'COP',
  "balance" DECIMAL(14,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event_line_items" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "type" "EventLineType" NOT NULL,
  "concept" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitCost" DECIMAL(14,2) NOT NULL,
  "projected" DECIMAL(14,2) NOT NULL,
  "actual" DECIMAL(14,2) NOT NULL,
  "paid" BOOLEAN NOT NULL DEFAULT false,
  "responsible" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "event_line_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "financial_records"
  ADD COLUMN "invoiceStatus" "InvoiceStatus" NOT NULL DEFAULT 'PAID',
  ADD COLUMN "taxType" "TaxType" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "taxPaid" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "bankAccountId" TEXT;

CREATE INDEX "financial_records_bankAccountId_idx" ON "financial_records"("bankAccountId");
CREATE INDEX "event_line_items_eventId_type_idx" ON "event_line_items"("eventId", "type");

ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "event_line_items" ADD CONSTRAINT "event_line_items_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
