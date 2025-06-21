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

    // Fetch all transactions for stats
    const allTransactions = await prisma.transaction.findMany({
      orderBy: {
        createdAt: "desc",
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

    const totalProfit =
      totalInstallmetnsInterest +
      totalPenaltyAmount +
      totalIncome -
      totalExpenses;

    return NextResponse.json({
      totalProfit,
      totalExpenses,
      totalInstallmetnsInterest,
      totalIncome,
      totalPenaltyAmount,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
