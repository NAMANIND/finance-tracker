import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Verify admin access
    requireAdmin(req);

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

    // Get overdue installments
    const overdueInstallments = await prisma.installment.findMany({
      where: {
        dueDate: {
          lt: today,
        },
        status: {
          in: ["PENDING", "OVERDUE"],
        },
      },
      include: {
        loan: {
          include: {
            borrower: {
              include: {
                agent: {
                  include: {
                    user: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    // Update status to OVERDUE
    await prisma.installment.updateMany({
      where: {
        id: {
          in: overdueInstallments
            .filter((installment) => installment.status === "PENDING")
            .map((installment) => installment.id),
        },
      },
      data: { status: "OVERDUE" },
    });

    // Format the response using the overdueInstallments array
    const formattedInstallments = overdueInstallments.map((installment) => ({
      id: installment.id,
      loanId: installment.loanId,
      amount: installment.amount,
      principal: installment.principal,
      interest: installment.interest,
      installmentAmount: installment.installmentAmount,
      dueDate: installment.dueDate,
      status: "OVERDUE", // Set status to OVERDUE since we just updated it
      borrowerName: installment.loan.borrower.name,
      borrowerPhone: installment.loan.borrower.phone,
      borrowerId: installment.loan.borrower.id,
      agentName: installment.loan.borrower.agent.user.name,
    }));

    return NextResponse.json(formattedInstallments);
  } catch (error) {
    console.error("Error fetching overdue installments:", error);
    return NextResponse.json(
      { error: "Failed to fetch overdue installments" },
      { status: 500 }
    );
  }
}
