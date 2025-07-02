import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { TransactionType, TransactionCategory } from "@prisma/client";

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

export async function PATCH(
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
    const updateData = await req.json();

    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        installment: true,
      },
    });

    if (!existingTransaction) {
      return new NextResponse(
        JSON.stringify({ error: "Transaction not found" }),
        { status: 404 }
      );
    }

    // Validate transaction type if provided
    if (
      updateData.type &&
      !Object.values(TransactionType).includes(updateData.type)
    ) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid transaction type" }),
        { status: 400 }
      );
    }

    // Validate transaction category if provided
    if (
      updateData.category &&
      !Object.values(TransactionCategory).includes(updateData.category)
    ) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid transaction category" }),
        { status: 400 }
      );
    }

    // Validate amount if provided
    if (updateData.amount !== undefined && updateData.amount < 0) {
      return new NextResponse(
        JSON.stringify({ error: "Amount must be non-negative" }),
        { status: 400 }
      );
    }

    // Build the update object
    const updateFields: any = {};

    if (updateData.amount !== undefined)
      updateFields.amount = Number(updateData.amount);
    if (updateData.type !== undefined) updateFields.type = updateData.type;
    if (updateData.category !== undefined)
      updateFields.category = updateData.category;
    if (updateData.notes !== undefined)
      updateFields.notes = updateData.notes || null;
    if (updateData.name !== undefined)
      updateFields.name = updateData.name || null;
    if (updateData.addedBy !== undefined)
      updateFields.addedBy = updateData.addedBy || null;
    if (updateData.penaltyAmount !== undefined)
      updateFields.penaltyAmount = Number(updateData.penaltyAmount) || 0;
    if (updateData.extraAmount !== undefined)
      updateFields.extraAmount = Number(updateData.extraAmount) || 0;
    if (updateData.interest !== undefined)
      updateFields.interest = Number(updateData.interest) || 0;
    if (updateData.createdAt !== undefined)
      updateFields.createdAt = new Date(updateData.createdAt);

    // Update the transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: updateFields,
      include: {
        installment: true,
      },
    });

    // If this is an installment transaction and amount changed, update installment amounts
    if (
      existingTransaction.installmentId &&
      existingTransaction.type === "INSTALLMENT" &&
      updateData.amount !== undefined
    ) {
      await prisma.installment.update({
        where: { id: existingTransaction.installmentId },
        data: {
          extraAmount: Number(
            updateData.extraAmount || existingTransaction.extraAmount
          ),
          penaltyAmount: Number(
            updateData.penaltyAmount || existingTransaction.penaltyAmount
          ),
        },
      });
    }

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to update transaction" }),
      { status: 500 }
    );
  }
}
