/*
  Warnings:

  - Added the required column `amount` to the `Installment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `installmentAmount` to the `Installment` table without a default value. This is not possible if the table is not empty.

*/
-- First add the columns as nullable
ALTER TABLE "Installment" ADD COLUMN "amount" DOUBLE PRECISION,
ADD COLUMN "installmentAmount" DOUBLE PRECISION;

-- Update existing records with calculated values
UPDATE "Installment" 
SET "amount" = "principal" + "interest",
    "installmentAmount" = "principal";

-- Make the columns required
ALTER TABLE "Installment" ALTER COLUMN "amount" SET NOT NULL,
ALTER COLUMN "installmentAmount" SET NOT NULL;
