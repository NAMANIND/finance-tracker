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

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return new NextResponse(
        JSON.stringify({ error: "Start date and end date are required" }),
        { status: 400 }
      );
    }

    // Fetch transactions within date range for the table
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

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
      transactions, // This will still be filtered by date range
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
