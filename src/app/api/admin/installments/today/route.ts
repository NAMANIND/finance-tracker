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

    // Get today's installments
    const installments = await prisma.installment.findMany({
      where: {
        dueDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: {
        loan: {
          include: {
            borrower: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          status: "asc", // This will put 'PENDING' first since it's alphabetically before other statuses
        },
        {
          dueDate: "asc",
        },
      ],
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
      { error: "Failed to fetch today's installments" },
      { status: 500 }
    );
  }
}
