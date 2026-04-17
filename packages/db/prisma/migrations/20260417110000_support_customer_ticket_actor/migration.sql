ALTER TABLE "tickets"
  ALTER COLUMN "created_by_user_id" DROP NOT NULL;

ALTER TABLE "tickets"
  ADD COLUMN "created_by_customer_user_id" UUID;

ALTER TABLE "ticket_comments"
  ALTER COLUMN "user_id" DROP NOT NULL;

ALTER TABLE "ticket_comments"
  ADD COLUMN "customer_user_id" UUID;

CREATE INDEX "tickets_created_by_user_id_idx" ON "tickets"("created_by_user_id");
CREATE INDEX "tickets_created_by_customer_user_id_idx" ON "tickets"("created_by_customer_user_id");
CREATE INDEX "ticket_comments_user_id_idx" ON "ticket_comments"("user_id");
CREATE INDEX "ticket_comments_customer_user_id_idx" ON "ticket_comments"("customer_user_id");

ALTER TABLE "tickets"
  ADD CONSTRAINT "tickets_created_by_customer_user_id_fkey"
  FOREIGN KEY ("created_by_customer_user_id") REFERENCES "customer_users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ticket_comments"
  ADD CONSTRAINT "ticket_comments_customer_user_id_fkey"
  FOREIGN KEY ("customer_user_id") REFERENCES "customer_users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
