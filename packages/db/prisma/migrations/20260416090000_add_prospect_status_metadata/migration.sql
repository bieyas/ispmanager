ALTER TABLE "prospects"
ADD COLUMN IF NOT EXISTS "survey_date" DATE,
ADD COLUMN IF NOT EXISTS "onu_serial_number" VARCHAR(120),
ADD COLUMN IF NOT EXISTS "last_status_updated_by_user_id" UUID,
ADD COLUMN IF NOT EXISTS "last_status_updated_at" TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS "status_reason" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'prospects_last_status_updated_by_user_id_fkey'
  ) THEN
    ALTER TABLE "prospects"
    ADD CONSTRAINT "prospects_last_status_updated_by_user_id_fkey"
    FOREIGN KEY ("last_status_updated_by_user_id") REFERENCES "users"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "prospects_survey_date_idx"
ON "prospects"("survey_date");

CREATE INDEX IF NOT EXISTS "prospects_last_status_updated_by_user_id_idx"
ON "prospects"("last_status_updated_by_user_id");
