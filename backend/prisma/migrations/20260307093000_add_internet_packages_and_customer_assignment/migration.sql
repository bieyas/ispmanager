-- CreateTable
CREATE TABLE "internet_packages" (
    "id" TEXT NOT NULL,
    "package_code" TEXT NOT NULL,
    "package_name" TEXT NOT NULL,
    "speed_mbps" INTEGER NOT NULL,
    "monthly_price" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internet_packages_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "customers" ADD COLUMN "current_package_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "internet_packages_package_code_key" ON "internet_packages"("package_code");

-- CreateIndex
CREATE INDEX "customers_current_package_id_idx" ON "customers"("current_package_id");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_current_package_id_fkey" FOREIGN KEY ("current_package_id") REFERENCES "internet_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
