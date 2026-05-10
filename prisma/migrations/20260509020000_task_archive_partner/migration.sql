ALTER TABLE "tasks"
  ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "responsiblePartnerId" TEXT;

CREATE INDEX "tasks_responsiblePartnerId_idx" ON "tasks"("responsiblePartnerId");

ALTER TABLE "tasks" ADD CONSTRAINT "tasks_responsiblePartnerId_fkey" FOREIGN KEY ("responsiblePartnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
