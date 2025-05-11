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

    const pendingInstallment = await prisma.installment.findFirstOrThrow({
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
    });

    const installments = [pendingInstallment, ...overdueInstallments];

    const formattedInstallments = installments.map((installment) => ({
      ...installment,
      amount: installment.amount,
      installmentAmount: installment.installmentAmount,
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
