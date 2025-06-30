import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { id } = await params;

    // Check if transaction exists
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        installment: true,
      },
    });

    if (!transaction) {
      return new NextResponse(
        JSON.stringify({ error: "Transaction not found" }),
        { status: 404 }
      );
    }

    // If this transaction is linked to an installment and marked it as PAID,
    // we need to revert the installment status
    if (transaction.installmentId && transaction.type === "INSTALLMENT") {
      await prisma.installment.update({
        where: { id: transaction.installmentId },
        data: {
          status: "PENDING",
          paidAt: null,
          dueAmount: 0,
          penaltyAmount: 0,
          extraAmount: 0,
        },
      });
    }

    // Delete the transaction
    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to delete transaction" }),
      { status: 500 }
    );
  }
}
