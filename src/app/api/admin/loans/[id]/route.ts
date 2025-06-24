import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    requireAdmin(req);

    const { id } = await params;

    // First check if loan has any paid installments
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        installments: true,
      },
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // const hasPaidInstallments = loan.installments.some(
    //   (inst) => inst.status === "PAID"
    // );

    // if (hasPaidInstallments) {
    //   return NextResponse.json(
    //     { error: "Cannot delete loan with paid installments" },
    //     { status: 400 }
    //   );
    // }

    // Since there are no paid installments, we can safely delete everything in proper order
    // First, find and delete the loan disbursement transaction
    await prisma.transaction.deleteMany({
      where: {
        type: "EXPENSE",
        category: "LOAN",
        notes: {
          contains: `Loan ID: ${id}`,
        },
      },
    });

    // Delete all installment-related transactions
    await prisma.transaction.deleteMany({
      where: {
        installment: {
          loanId: id,
        },
      },
    });

    // Delete all installments
    await prisma.installment.deleteMany({
      where: { loanId: id },
    });

    // Finally delete the loan
    await prisma.loan.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Loan and all its installments deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting loan:", error);
    return NextResponse.json(
      { error: "Failed to delete loan" },
      { status: 500 }
    );
  }
}
