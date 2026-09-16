-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PEMBELIAN', 'PENJUALAN', 'OPERASIONAL');

-- CreateEnum
CREATE TYPE "DedakType" AS ENUM ('MURNI', 'CAMPURAN', 'CEPU', 'NON_DEDAK');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('LUNAS', 'TEMPO');

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "dedakType" "DedakType" NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "quantityKg" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pricePerKg" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'LUNAS',
    "contactName" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "dedakType" "DedakType" NOT NULL,
    "stockKg" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "refresh_token" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_contactName_idx" ON "Transaction"("contactName");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_dedakType_key" ON "Inventory"("dedakType");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
