import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // Verify admin access
    const user = requireAdmin(request as any);

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format the response
    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      notes: transaction.notes,
      installmentId: transaction.installmentId,
      createdAt: transaction.createdAt,
    }));

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching today's transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
