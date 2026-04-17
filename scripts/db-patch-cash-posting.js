const { PrismaClient } = require("../packages/db/generated/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('ALTER TABLE "cash_transactions" ADD COLUMN IF NOT EXISTS "payment_id" UUID');
  await prisma.$executeRawUnsafe(`DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'cash_transactions_payment_id_fkey'
    ) THEN
      ALTER TABLE "cash_transactions"
      ADD CONSTRAINT "cash_transactions_payment_id_fkey"
      FOREIGN KEY ("payment_id") REFERENCES "payments"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END $$;`);
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "cash_transactions_payment_id_key" ON "cash_transactions"("payment_id")',
  );
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "cash_transactions_payment_id_idx" ON "cash_transactions"("payment_id")',
  );
  await prisma.$executeRawUnsafe(`INSERT INTO "cash_categories" (
      "id",
      "code",
      "name",
      "type",
      "is_active",
      "description",
      "default_keterangan_template",
      "created_at",
      "updated_at"
    )
    SELECT
      gen_random_uuid(),
      'subscription_income',
      'Pemasukan Langganan',
      'cash_in'::"CashTransactionType",
      true,
      'Pemasukan pembayaran tagihan langganan internet.',
      'Pembayaran langganan pelanggan {customer_code}',
      NOW(),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM "cash_categories" WHERE "code" = 'subscription_income'
    )`);

  console.log("db patch applied");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
