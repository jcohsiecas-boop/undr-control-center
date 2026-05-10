CREATE TYPE "DocumentStatus" AS ENUM ('PROJECTED', 'CONFIRMED', 'INVOICED', 'PARTIALLY_COLLECTED', 'COLLECTED', 'VOID', 'APPROVED', 'COMMITTED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'SETTLED');

CREATE TABLE "financial_categories" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "FinancialType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "financial_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "movement_payments" (
  "id" TEXT NOT NULL,
  "movementId" TEXT NOT NULL,
  "bankAccountId" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "movement_payments_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "financial_records"
  ADD COLUMN "documentStatus" "DocumentStatus" NOT NULL DEFAULT 'PROJECTED',
  ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "paidAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN "pendingBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN "dueDate" TIMESTAMP(3),
  ADD COLUMN "responsible" TEXT,
  ADD COLUMN "eventId" TEXT,
  ADD COLUMN "deletedAt" TIMESTAMP(3);

UPDATE "financial_records" SET
  "documentStatus" = CASE
    WHEN "type" = 'INCOME' AND "projected" = true THEN 'PROJECTED'::"DocumentStatus"
    WHEN "type" = 'INCOME' AND "invoiceStatus" = 'RECEIVABLE' THEN 'INVOICED'::"DocumentStatus"
    WHEN "type" = 'INCOME' THEN 'COLLECTED'::"DocumentStatus"
    WHEN "type" = 'EXPENSE' AND "projected" = true THEN 'PROJECTED'::"DocumentStatus"
    ELSE 'PAID'::"DocumentStatus"
  END,
  "paymentStatus" = CASE
    WHEN "invoiceStatus" = 'RECEIVABLE' THEN 'PENDING'::"PaymentStatus"
    ELSE 'SETTLED'::"PaymentStatus"
  END,
  "paidAmount" = CASE WHEN "invoiceStatus" = 'RECEIVABLE' THEN 0 ELSE "amount" END,
  "pendingBalance" = CASE WHEN "invoiceStatus" = 'RECEIVABLE' THEN "amount" ELSE 0 END;

CREATE UNIQUE INDEX "financial_categories_name_type_key" ON "financial_categories"("name", "type");
CREATE INDEX "movement_payments_movementId_idx" ON "movement_payments"("movementId");
CREATE INDEX "movement_payments_bankAccountId_idx" ON "movement_payments"("bankAccountId");
CREATE INDEX "financial_records_eventId_idx" ON "financial_records"("eventId");

ALTER TABLE "movement_payments" ADD CONSTRAINT "movement_payments_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "financial_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "movement_payments" ADD CONSTRAINT "movement_payments_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
