import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    requireAdmin(req);

    const { id } = await params;

    // Check if installment exists and is currently paid
    const installment = await prisma.installment.findUnique({
      where: { id },
    });

    if (!installment) {
      return NextResponse.json(
        { error: "Installment not found" },
        { status: 404 }
      );
    }

    if (installment.status !== "PAID") {
      return NextResponse.json(
        { error: "Installment is not currently paid" },
        { status: 400 }
      );
    }

    // Perform all operations in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all transactions associated with this installment
      await tx.transaction.deleteMany({
        where: {
          installmentId: id,
          type: "INSTALLMENT",
        },
      });

      // Update installment to reset to unpaid state
      await tx.installment.update({
        where: { id },
        data: {
          status: "PENDING",
          paidAt: null,
          extraAmount: 0,
          penaltyAmount: 0,
          dueAmount: 0,
        },
      });
    });

    return NextResponse.json({
      message: "Installment marked as unpaid successfully",
    });
  } catch (error: unknown) {
    console.error("Error marking installment as unpaid:", error);
    return NextResponse.json(
      { error: "Failed to mark installment as unpaid" },
      { status: 500 }
    );
  }
}
