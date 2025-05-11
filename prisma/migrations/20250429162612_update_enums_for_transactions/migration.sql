/*
  Warnings:

  - The values [PAYMENT,LOAN,PENALTY] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "TransactionCategory" ADD VALUE 'INSTALLMENT';

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('EXPENSE', 'INSTALLMENT', 'OTHER');
ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "TransactionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "type" SET DEFAULT 'OTHER',
ALTER COLUMN "category" SET DEFAULT 'OTHER';
