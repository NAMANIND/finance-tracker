import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const user = await requireAdmin(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get upcoming dues for today
    // Create start of today in IST (UTC+5:30)
    const today = new Date();
    // Convert to IST by adding 5 hours and 30 minutes
    today.setUTCHours(
      today.getUTCHours() + 5,
      today.getUTCMinutes() + 30,
      0,
      0
    );
    // Set to start of day
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total active loans
    const totalLoans = await prisma.loan.count({
      where: { status: "ACTIVE" },
    });

    // Get total borrowers
    const totalBorrowers = await prisma.borrower.count();

    // Get total agents
    const totalAgents = await prisma.agent.count();

    // Get total profit (sum of all paid interest)
    const totalProfit = await prisma.installment.aggregate({
      where: { status: "PAID" },
      _sum: { interest: true },
    });

    const totalDue = await prisma.installment.aggregate({
      where: {
        dueDate: {
          lt: today,
        },
        status: {
          in: ["PENDING", "OVERDUE"],
        },
      },
      _sum: { amount: true },
    });

    const upcomingDues = await prisma.installment.count({
      where: {
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
        status: "PENDING",
      },
    });

    // Get defaulters (overdue installments)
    const defaulters = await prisma.installment.count({
      where: {
        dueDate: {
          lt: today,
        },
        status: "PENDING",
      },
    });

    return NextResponse.json({
      totalLoans,
      totalBorrowers,
      totalAgents,
      totalProfit: totalProfit._sum.interest || 0,
      upcomingDues,
      defaulters,
      totalDue: totalDue._sum.amount || 0,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
