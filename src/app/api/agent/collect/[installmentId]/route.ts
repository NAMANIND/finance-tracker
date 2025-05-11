import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/auth";
import { TransactionCategory, TransactionType } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { installmentId: string } }
) {
  try {
    // Verify agent access
    const agent = requireAgent(req);

    const { installmentId } = params;
    const { amount, notes } = await req.json();

    // Validate required fields
    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
    }

    // Get the installment
    const installment = await prisma.installment.findUnique({
      where: { id: installmentId },
      include: {
        loan: {
          include: {
            borrower: true,
          },
        },
      },
    });

    if (!installment) {
      return NextResponse.json(
        { error: "Installment not found" },
        { status: 404 }
      );
    }

    // Check if the agent is assigned to the borrower
    if (installment.loan.borrower.agentId !== agent.id) {
      return NextResponse.json(
        { error: "You are not authorized to collect this installment" },
        { status: 403 }
      );
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        amount,
        type: TransactionType.EXPENSE,
        category: TransactionCategory.PERSONAL,
        notes,
        installmentId,
      },
    });

    // Update installment status
    await prisma.installment.update({
      where: { id: installmentId },
      data: { status: "PAID" },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error collecting installment:", error);
    return NextResponse.json(
      { error: "Failed to collect installment" },
      { status: 500 }
    );
  }
}
