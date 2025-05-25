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

    const hasPaidInstallments = loan.installments.some(
      (inst) => inst.status === "PAID"
    );

    if (hasPaidInstallments) {
      return NextResponse.json(
        { error: "Cannot delete loan with paid installments" },
        { status: 400 }
      );
    }

    // Delete the loan - this will automatically delete all associated installments
    // due to the cascading delete behavior in Prisma
    await prisma.loan.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Loan and all its installments deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting loan:", error);
    return NextResponse.json(
      { error: "Failed to delete loan" },
      { status: 500 }
    );
  }
}
