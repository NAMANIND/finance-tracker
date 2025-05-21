import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

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

    // Calculate statistics using all transactions
    const totalInstallments = allTransactions
      .filter((t) => t.type === "INSTALLMENT")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = allTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = allTransactions
      .filter((t) => t.type === "OTHER")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalProfit = totalInstallments + totalIncome - totalExpenses;

    return NextResponse.json({
      totalProfit,
      totalExpenses,
      totalInstallments,
      totalIncome,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
