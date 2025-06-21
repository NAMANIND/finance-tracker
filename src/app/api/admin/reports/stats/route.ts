import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { TransactionCategory } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || new Date().toISOString();

    // Fetch all transactions for stats
    const allTransactions = await prisma.transaction.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const allLoans = await prisma.loan.findMany({
      where: {
        status: "ACTIVE",
      },
    });

    // Filter out NEUTRAL category transactions from all calculations
    const transactionsForCalculations = allTransactions.filter(
      (t) => t.category !== TransactionCategory.NEUTRAL
    );

    // Calculate statistics using filtered transactions

    const totalInstallmetnsInterest = transactionsForCalculations
      .filter((t) => t.type === "INSTALLMENT")
      .reduce((sum, t) => sum + t.interest, 0);

    const totalPenaltyAmount = transactionsForCalculations
      .filter((t) => t.type === "INSTALLMENT")
      .reduce((sum, t) => sum + t.penaltyAmount, 0);

    const totalExpenses = transactionsForCalculations
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalInstallmentAmount = transactionsForCalculations
      .filter((t) => t.type === "INSTALLMENT")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome =
      transactionsForCalculations
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + t.amount, 0) + totalInstallmentAmount;

    const totalCapital = transactionsForCalculations
      .filter((t) => t.type === "CAPITAL")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalLoanAmount = allLoans.reduce(
      (sum, loan) => sum + loan.principalAmount,
      0
    );

    const totalActiveLoansAmount = allLoans
      .filter((loan) => loan.status === "ACTIVE")
      .reduce((sum, loan) => {
        // If frequency is weekly, subtract the interest amount from principal
        if (loan.frequency === "WEEKLY") {
          const interestAmount =
            (loan.interestRate * loan.duration * loan.principalAmount) / 100;
          return sum + loan.principalAmount - interestAmount;
        }
        return sum + loan.principalAmount;
      }, 0);

    const totalProfit = totalPenaltyAmount + totalIncome - totalExpenses;

    const transactionsExcludingToday = transactionsForCalculations.filter(
      (t) => new Date(t.createdAt) < new Date(new Date(startDate).getTime()) // one day before end date
    );

    const totalIncomeExcludingToday =
      transactionsExcludingToday
        .filter((t) => t.type === "INCOME" || t.type === "CAPITAL")
        .reduce((sum, t) => sum + t.amount, 0) +
      transactionsExcludingToday
        .filter((t) => t.type === "INSTALLMENT")
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpensesExcludingToday = transactionsExcludingToday
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const openingBalance =
      totalIncomeExcludingToday - totalExpensesExcludingToday;

    return NextResponse.json({
      totalProfit,
      totalExpenses,
      totalInstallmetnsInterest,
      totalIncome,
      totalPenaltyAmount,
      openingBalance,
      totalCapital,
      totalLoanAmount,
      totalActiveLoansAmount,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
