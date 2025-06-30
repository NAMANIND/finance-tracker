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

    // Get today's date range
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

    // Get all agents with their collections for today
    const agents = await prisma.agent.findMany({
      include: {
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
        borrowers: {
          include: {
            loans: {
              include: {
                installments: {
                  where: {
                    OR: [
                      // Installments paid today
                      {
                        status: "PAID",
                        paidAt: {
                          gte: today,
                          lt: tomorrow,
                        },
                      },
                      // Installments due today
                      {
                        dueDate: {
                          gte: today,
                          lt: tomorrow,
                        },
                        status: "PENDING",
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    });

    // Transform the data to get collection stats per agent
    const agentCollections = agents.map((agent) => {
      const totalCollections = agent.borrowers.reduce((total, borrower) => {
        return (
          total +
          borrower.loans.reduce((loanTotal, loan) => {
            return (
              loanTotal +
              loan.installments.reduce(
                (instTotal, inst) =>
                  inst.status === "PAID" &&
                  inst.paidAt &&
                  inst.paidAt >= today &&
                  inst.paidAt < tomorrow
                    ? instTotal +
                      inst.amount +
                      inst.extraAmount +
                      inst.penaltyAmount -
                      inst.dueAmount
                    : instTotal,
                0
              )
            );
          }, 0)
        );
      }, 0);

      const totalInstallments = agent.borrowers.reduce((total, borrower) => {
        return (
          total +
          borrower.loans.reduce((loanTotal, loan) => {
            return (
              loanTotal +
              loan.installments.reduce(
                (instTotal, inst) =>
                  instTotal +
                  inst.amount +
                  inst.extraAmount +
                  inst.penaltyAmount,
                0
              )
            );
          }, 0)
        );
      }, 0);

      return {
        agentId: agent.id,
        agentName: agent.user.name,
        agentPhone: agent.user.phone,
        totalCollections,
        totalInstallments,
      };
    });

    return NextResponse.json(agentCollections);
  } catch (error) {
    console.error("Error fetching agent collections:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
