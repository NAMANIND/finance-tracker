import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addMonths, subDays, isBefore, isAfter } from "date-fns";

export async function GET() {
  try {
    // Get all active loans with their latest installment
    const activeLoans = await prisma.loan.findMany({
      where: {
        status: "ACTIVE",
        frequency: "MONTHLY",
      },
      include: {
        installments: {
          orderBy: {
            dueDate: "desc",
          },
          take: 1,
        },
      },
    });

    const today = new Date();

    // Create all installments in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdInstallments = [];

      for (const loan of activeLoans) {
        if (loan.installments.length === 0) continue;

        const lastInstallment = loan.installments[0];
        let nextDueDate = addMonths(new Date(lastInstallment.dueDate), 1);

        // Keep creating installments until we reach today's date
        while (
          isBefore(nextDueDate, today) ||
          isAfter(today, subDays(nextDueDate, 7))
        ) {
          // Check if installment already exists for this period
          const existing = await tx.installment.findFirst({
            where: {
              loan: { id: loan.id },
              dueDate: {
                gte: subDays(nextDueDate, 7),
                lte: nextDueDate,
              },
            },
          });

          if (!existing) {
            const newInstallment = await tx.installment.create({
              data: {
                loan: { connect: { id: loan.id } },
                amount: 0,
                principal: 0,
                interest: Number(
                  ((loan.principalAmount * loan.interestRate) / 100).toFixed(2)
                ),
                installmentAmount: 0,
                dueDate: nextDueDate,
                status: "PENDING",
              },
            });
            createdInstallments.push(newInstallment);
          }

          // Move to next month
          nextDueDate = addMonths(nextDueDate, 1);
        }
      }

      return createdInstallments;
    });

    return NextResponse.json({
      message: "Installments generated successfully",
      count: result.length,
      installments: result,
    });
  } catch (error) {
    console.error("Error generating installments:", error);
    return NextResponse.json(
      { error: "Failed to generate installments" },
      { status: 500 }
    );
  }
}
