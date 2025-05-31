import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { startOfDay, endOfDay, parse } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    // Verify admin access
    requireAdmin(req);

    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const agents = await prisma.agent.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        borrowers: {
          include: {
            loans: {
              include: {
                installments: {
                  where:
                    startDate && endDate
                      ? {
                          dueDate: {
                            gte: startOfDay(
                              parse(startDate, "yyyy-MM-dd", new Date())
                            ),
                            lte: endOfDay(
                              parse(endDate, "yyyy-MM-dd", new Date())
                            ),
                          },
                        }
                      : undefined,
                  include: {
                    loan: {
                      include: {
                        borrower: true,
                      },
                    },
                  },
                  orderBy: [
                    {
                      status: "asc", // This will order OVERDUE first, then PENDING, then PAID
                    },
                    {
                      dueDate: "asc", // Secondary sort by due date
                    },
                  ],
                },
              },
            },
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    const formattedAgents = agents.map((agent) => {
      const allLoans = agent.borrowers.flatMap((borrower) => borrower.loans);
      const activeLoans = allLoans.filter((loan) => loan.status === "ACTIVE");
      const totalAmount = allLoans.reduce(
        (sum, loan) => sum + loan.principalAmount,
        0
      );
      const totalBorrowers = agent.borrowers.length;

      // Calculate collection statistics
      const allInstallments = allLoans.flatMap((loan) => loan.installments);
      const target = allInstallments.reduce(
        (sum, inst) => sum + inst.amount,
        0
      );
      const collected = allInstallments
        .filter((inst) => inst.status === "PAID")
        .reduce((sum, inst) => sum + inst.amount, 0);
      const pending = allInstallments
        .filter((inst) => inst.status === "PENDING")
        .reduce((sum, inst) => sum + inst.amount, 0);
      const overdue = allInstallments
        .filter((inst) => inst.status === "OVERDUE")
        .reduce((sum, inst) => sum + inst.amount, 0);

      // Get today's installments
      const todayInstallments = allInstallments.map((installment) => ({
        id: installment.id,
        amount: installment.amount,
        status: installment.status,
        dueDate: installment.dueDate,
        borrowerName: installment.loan.borrower.name,
        borrowerPhone: installment.loan.borrower.phone,
        loanId: installment.loan.id,
      }));

      return {
        id: agent.id,
        name: agent.user.name,
        email: agent.user.email,
        phone: agent.user.phone,
        totalLoans: allLoans.length,
        activeLoans: activeLoans.length,
        totalBorrowers,
        totalAmount,
        collections: {
          target,
          collected,
          pending,
          overdue,
        },
        todayInstallments,
      };
    });

    return NextResponse.json(formattedAgents);
  } catch (error) {
    console.error("Error fetching agent reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent reports" },
      { status: 500 }
    );
  }
}
