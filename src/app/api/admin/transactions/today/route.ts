import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const today = new Date().toISOString().split("T")[0];

    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: today,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to include borrowerName directly
    const transformedTransactions = transactions.map((transaction) => ({
      ...transaction,
      borrowerName: transaction.name || "Unknown",
    }));

    return NextResponse.json(transformedTransactions);
  } catch (error) {
    console.error("Error fetching today's transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch today's transactions" },
      { status: 500 }
    );
  }
}
