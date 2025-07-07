import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Verify agent access
    const user = requireAgent(request as NextRequest);
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

    // console.log("Fetching stats for agent:", agent.id);

    // Get total borrowers
    const totalBorrowers = await prisma.borrower.count({
      where: { agentId: agent.id },
    });

    // console.log("Total borrowers:", totalBorrowers);

    // Get total active loans
    const totalActiveLoans = await prisma.loan.count({
      where: {
        borrower: { agentId: agent.id },
        status: "ACTIVE",
      },
    });

    // console.log("Total active loans:", totalActiveLoans);

    // Get today's collections
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
        amount: true,
        extraAmount: true,
        dueAmount: true,
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

    // Get total due amount and count
    const totalDues = await prisma.installment.aggregate({
      where: {
        loan: {
          borrower: { agentId: agent.id },
        },
        status: "OVERDUE",
      },
      _sum: {
        principal: true,
        interest: true,
      },
      _count: true,
    });

    // Get dues for today
    const duesToday = await prisma.installment.findMany({
      where: {
        loan: {
          borrower: { agentId: agent.id },
        },
        status: "OVERDUE",
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

    const pendingsToday = await prisma.installment.findMany({
      where: {
        loan: {
          borrower: { agentId: agent.id },
        },
        status: "PENDING",
        dueDate: {
          gte: today,
          lt: tomorrow, // Only consider dues for today
        },
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
    // console.log("Pendings today:", pendingsToday.length);
    // console.log("Total dues:", totalDues._count);
    // console.log("Total dues amount:", totalDues._sum.principal + totalDues._sum.interest);

    // console.log("Dues today:", duesToday.length);

    return NextResponse.json({
      totalBorrowers,
      totalActiveLoans,
      totalCollectedToday:
        (todayCollections?._sum.amount || 0) +
        (todayCollections?._sum.extraAmount || 0) -
        (todayCollections?._sum.dueAmount || 0),
      totalCollectedThisMonth:
        (monthCollections._sum.principal || 0) +
        (monthCollections._sum.interest || 0),
      totalProfit: totalProfit._sum.interest || 0,
      totalDueAmount:
        (totalDues._sum.principal || 0) + (totalDues._sum.interest || 0),
      totalDueCount: totalDues._count || 0,
      duesToday: duesToday.map((due) => ({
        borrower: due.loan.borrower,
        amount: due.principal + due.interest,
        dueDate: due.dueDate.toISOString(),
        loanId: due.loan.id,
        installmentId: due.id,
        interest: due.interest,
      })),
      pendingsToday: pendingsToday.map((due) => ({
        borrower: due.loan.borrower,
        amount: due.principal + due.interest,
        dueDate: due.dueDate.toISOString(),
        loanId: due.loan.id,
        installmentId: due.id,
        interest: due.interest,
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
