import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // Verify agent access
    const user = requireAgent(request as any);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get agent details
    const agent = await prisma.agent.findUnique({
      where: { userId: user.id },
    });

    if (!agent) {
      console.error("Agent not found for user:", user.id);
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    console.log("Fetching stats for agent:", agent.id);

    // Get total borrowers
    const totalBorrowers = await prisma.borrower.count({
      where: { agentId: agent.id },
    });

    console.log("Total borrowers:", totalBorrowers);

    // Get total active loans
    const totalActiveLoans = await prisma.loan.count({
      where: {
        borrower: { agentId: agent.id },
        status: "ACTIVE",
      },
    });

    console.log("Total active loans:", totalActiveLoans);

    // Get today's collections
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCollections = await prisma.installment.aggregate({
      where: {
        loan: {
          borrower: { agentId: agent.id },
        },
        status: "PAID",
        paidAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        principal: true,
        interest: true,
      },
    });

    // Get this month's collections
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfNextMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      1
    );

    const monthCollections = await prisma.installment.aggregate({
      where: {
        loan: {
          borrower: { agentId: agent.id },
        },
        status: "PAID",
        paidAt: {
          gte: firstDayOfMonth,
          lt: firstDayOfNextMonth,
        },
      },
      _sum: {
        principal: true,
        interest: true,
      },
    });

    // Get total profit (interest collected)
    const totalProfit = await prisma.installment.aggregate({
      where: {
        loan: {
          borrower: { agentId: agent.id },
        },
        status: "PAID",
      },
      _sum: {
        interest: true,
      },
    });

    // Get dues for today
    const duesToday = await prisma.installment.findMany({
      where: {
        loan: {
          borrower: { agentId: agent.id },
        },
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
        status: "PENDING",
      },
      select: {
        id: true,
        principal: true,
        interest: true,
        dueDate: true,
        loan: {
          select: {
            id: true,
            borrower: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    console.log("Dues today:", duesToday.length);

    return NextResponse.json({
      totalBorrowers,
      totalActiveLoans,
      totalCollectedToday:
        (todayCollections._sum.principal || 0) +
        (todayCollections._sum.interest || 0),
      totalCollectedThisMonth:
        (monthCollections._sum.principal || 0) +
        (monthCollections._sum.interest || 0),
      totalProfit: totalProfit._sum.interest || 0,
      duesToday: duesToday.map((due) => ({
        borrower: due.loan.borrower,
        amount: due.principal + due.interest,
        dueDate: due.dueDate.toISOString(),
        loanId: due.loan.id,
        installmentId: due.id,
      })),
    });
  } catch (error) {
    console.error("Error fetching agent stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
