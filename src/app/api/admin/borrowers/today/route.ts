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

    // Get today's borrowers
    const borrowers = await prisma.borrower.findMany({
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

    return NextResponse.json(borrowers);
  } catch (error) {
    console.error("Error fetching today's borrowers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
