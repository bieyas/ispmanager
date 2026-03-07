-- CreateTable
CREATE TABLE "ppp_profiles" (
    "id" TEXT NOT NULL,
    "profile_code" TEXT NOT NULL,
    "profile_name" TEXT NOT NULL,
    "local_address" TEXT NOT NULL,
    "remote_pool_name" TEXT NOT NULL,
    "dns_servers" TEXT,
    "only_one" BOOLEAN NOT NULL DEFAULT true,
    "router_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppp_profiles_pkey" PRIMARY KEY ("id")
);

-- Seed default PPP profile for existing packages
INSERT INTO "ppp_profiles" (
    "id",
    "profile_code",
    "profile_name",
    "local_address",
    "remote_pool_name",
    "dns_servers",
    "only_one",
    "router_name",
    "is_active",
    "created_at",
    "updated_at"
)
VALUES (
    '11111111-1111-4111-8111-111111111111',
    'PPP-DEFAULT',
    'PPP Default',
    '10.10.10.1',
    'POOL-DEFAULT',
    NULL,
    true,
    NULL,
    true,
    NOW(),
    NOW()
);

-- AlterTable
ALTER TABLE "internet_packages"
    ADD COLUMN "download_kbps" INTEGER,
    ADD COLUMN "upload_kbps" INTEGER,
    ADD COLUMN "ppp_profile_id" TEXT;

-- Backfill bandwidth from old speed_mbps (Mbps -> Kbps)
UPDATE "internet_packages"
SET
    "download_kbps" = "speed_mbps" * 1024,
    "upload_kbps" = "speed_mbps" * 1024,
    "ppp_profile_id" = '11111111-1111-4111-8111-111111111111'
WHERE "download_kbps" IS NULL OR "upload_kbps" IS NULL OR "ppp_profile_id" IS NULL;

-- Enforce not null after backfill
ALTER TABLE "internet_packages"
    ALTER COLUMN "download_kbps" SET NOT NULL,
    ALTER COLUMN "upload_kbps" SET NOT NULL,
    ALTER COLUMN "ppp_profile_id" SET NOT NULL;

-- Remove old column
ALTER TABLE "internet_packages" DROP COLUMN "speed_mbps";

-- Indexes
CREATE UNIQUE INDEX "ppp_profiles_profile_code_key" ON "ppp_profiles"("profile_code");
CREATE INDEX "internet_packages_ppp_profile_id_idx" ON "internet_packages"("ppp_profile_id");

-- FKs
ALTER TABLE "internet_packages"
    ADD CONSTRAINT "internet_packages_ppp_profile_id_fkey"
    FOREIGN KEY ("ppp_profile_id") REFERENCES "ppp_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
