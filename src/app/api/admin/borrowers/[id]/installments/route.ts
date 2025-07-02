import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    requireAdmin(req);

    const { id } = await params;

    const pendingInstallment = await prisma.installment.findFirst({
      where: {
        loan: {
          borrowerId: id,
        },
        status: "PENDING",
      },
      include: {
        loan: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    const overdueInstallments = await prisma.installment.findMany({
      where: {
        loan: {
          borrowerId: id,
        },
        status: "OVERDUE",
      },
      include: {
        loan: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    const installments: typeof overdueInstallments = [];

    if (pendingInstallment && overdueInstallments.length > 0) {
      installments.push(...overdueInstallments, pendingInstallment);
    } else if (pendingInstallment) {
      installments.push(pendingInstallment);
    } else if (overdueInstallments.length > 0) {
      installments.push(...overdueInstallments);
    }

    const formattedInstallments = installments.map((installment) => ({
      ...installment,
      amount: installment.amount,
      installmentAmount: installment.installmentAmount,
      frequency: installment.loan.frequency,
    }));

    return NextResponse.json(formattedInstallments);
  } catch (error) {
    console.error("Error fetching installments:", error);
    return NextResponse.json(
      { error: "Failed to fetch installments" },
      { status: 500 }
    );
  }
}
