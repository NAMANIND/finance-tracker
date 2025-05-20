-- AlterEnum
ALTER TYPE "TransactionCategory" ADD VALUE 'INCOME';

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'INCOME';

-- AlterTable
ALTER TABLE "Installment" ADD COLUMN     "extraAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "penaltyAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
