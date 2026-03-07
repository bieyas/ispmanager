-- CreateEnum
CREATE TYPE "InvoiceSource" AS ENUM ('MANUAL', 'AUTO');

-- AlterTable
ALTER TABLE "invoices"
    ADD COLUMN "billing_year" INTEGER,
    ADD COLUMN "billing_month" INTEGER,
    ADD COLUMN "source" "InvoiceSource" NOT NULL DEFAULT 'MANUAL';

-- Backfill period columns from due_date
UPDATE "invoices"
SET
    "billing_year" = EXTRACT(YEAR FROM "due_date")::INTEGER,
    "billing_month" = EXTRACT(MONTH FROM "due_date")::INTEGER
WHERE "billing_year" IS NULL OR "billing_month" IS NULL;

-- Enforce NOT NULL after backfill
ALTER TABLE "invoices"
    ALTER COLUMN "billing_year" SET NOT NULL,
    ALTER COLUMN "billing_month" SET NOT NULL;

-- Index and uniqueness for idempotent monthly generation
CREATE INDEX "invoices_billing_year_billing_month_idx" ON "invoices"("billing_year", "billing_month");
CREATE UNIQUE INDEX "invoices_customer_id_billing_year_billing_month_key"
ON "invoices"("customer_id", "billing_year", "billing_month");
