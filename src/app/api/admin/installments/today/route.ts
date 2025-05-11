import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // Verify admin access
    requireAdmin(request as any);

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's installments
    const installments = await prisma.installment.findMany({
      where: {
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
        status: "PENDING",
      },
      include: {
        loan: {
          include: {
            borrower: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    // Format the response
    const formattedInstallments = installments.map((installment) => ({
      id: installment.id,
      borrowerName: installment.loan.borrower.name,
      borrowerPhone: installment.loan.borrower.phone,
      amount: installment.amount,
      principal: installment.principal,
      interest: installment.interest,
      installmentAmount: installment.installmentAmount,
      dueDate: installment.dueDate,
      status: installment.status,
    }));

    return NextResponse.json(formattedInstallments);
  } catch (error) {
    console.error("Error fetching today's installments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
