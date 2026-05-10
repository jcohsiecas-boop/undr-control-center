CREATE TYPE "EventStatus" AS ENUM ('PLANNING', 'ACTIVE', 'CLOSED', 'CANCELLED');

ALTER TABLE "events"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "status" "EventStatus" NOT NULL DEFAULT 'PLANNING';

UPDATE "events"
SET "slug" = lower(regexp_replace(trim("name"), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring("id", 1, 6)
WHERE "slug" IS NULL;

ALTER TABLE "events" ALTER COLUMN "slug" SET NOT NULL;

ALTER TABLE "event_line_items"
  ADD COLUMN "financialStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "actionedById" TEXT,
  ADD COLUMN "actionedAt" TIMESTAMP(3);

UPDATE "event_line_items"
SET "financialStatus" = CASE WHEN "paid" = true THEN 'SETTLED'::"PaymentStatus" ELSE 'PENDING'::"PaymentStatus" END;

CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");
CREATE INDEX "event_line_items_financialStatus_idx" ON "event_line_items"("financialStatus");
CREATE INDEX "event_line_items_actionedById_idx" ON "event_line_items"("actionedById");

ALTER TABLE "event_line_items" ADD CONSTRAINT "event_line_items_actionedById_fkey" FOREIGN KEY ("actionedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
