-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('customer', 'sales', 'warehouse', 'legal');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('draft', 'pending_sales_review', 'pending_legal_review', 'sales_rejected', 'legal_rejected', 'approved', 'pending_shipment', 'shipped', 'in_testing', 'pending_return', 'returning', 'inspecting', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "SampleStatus" AS ENUM ('available', 'borrowed', 'maintenance', 'retired');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('pending', 'paid', 'refunding', 'refunded', 'deducted');

-- CreateEnum
CREATE TYPE "LogisticsType" AS ENUM ('outbound', 'return');

-- CreateEnum
CREATE TYPE "LogisticsStatus" AS ENUM ('created', 'shipped', 'in_transit', 'delivered', 'returned', 'failed');

-- CreateEnum
CREATE TYPE "TestResult" AS ENUM ('pass', 'fail', 'partial');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sample" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "description" TEXT,
    "value" DECIMAL(10,2) NOT NULL,
    "depositAmount" DECIMAL(10,2) NOT NULL,
    "status" "SampleStatus" NOT NULL DEFAULT 'available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "applicationNo" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "targetCountry" TEXT NOT NULL,
    "testPurpose" TEXT NOT NULL,
    "expectedReturnDate" DATE NOT NULL,
    "actualReturnDate" DATE,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'draft',
    "salesReviewComment" TEXT,
    "legalReviewComment" TEXT,
    "salesReviewerId" TEXT,
    "legalReviewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deposit" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "DepositStatus" NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "deductionReason" TEXT,

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Logistics" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "LogisticsType" NOT NULL,
    "courier" TEXT NOT NULL,
    "trackingNo" TEXT NOT NULL,
    "status" "LogisticsStatus" NOT NULL DEFAULT 'created',
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Logistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "testResult" "TestResult" NOT NULL,
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnInspection" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hasDamage" BOOLEAN NOT NULL DEFAULT false,
    "damageDescription" TEXT,
    "inspectorId" TEXT NOT NULL,
    "inspectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'pending',
    "signedAt" TIMESTAMP(3),
    "legalReviewerId" TEXT,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Sample_serialNumber_key" ON "Sample"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Application_applicationNo_key" ON "Application"("applicationNo");

-- CreateIndex
CREATE INDEX "Application_customerId_idx" ON "Application"("customerId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Deposit_applicationId_key" ON "Deposit"("applicationId");

-- CreateIndex
CREATE INDEX "Logistics_applicationId_idx" ON "Logistics"("applicationId");

-- CreateIndex
CREATE INDEX "Logistics_trackingNo_idx" ON "Logistics"("trackingNo");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_applicationId_key" ON "Feedback"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnInspection_applicationId_key" ON "ReturnInspection"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_applicationId_key" ON "Contract"("applicationId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_salesReviewerId_fkey" FOREIGN KEY ("salesReviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_legalReviewerId_fkey" FOREIGN KEY ("legalReviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Logistics" ADD CONSTRAINT "Logistics_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnInspection" ADD CONSTRAINT "ReturnInspection_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnInspection" ADD CONSTRAINT "ReturnInspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_legalReviewerId_fkey" FOREIGN KEY ("legalReviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
