/*
  Warnings:

  - You are about to drop the column `agentId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `loanId` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_agentId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_loanId_fkey";

-- DropIndex
DROP INDEX "Transaction_agentId_idx";

-- DropIndex
DROP INDEX "Transaction_loanId_idx";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "agentId",
DROP COLUMN "loanId";
