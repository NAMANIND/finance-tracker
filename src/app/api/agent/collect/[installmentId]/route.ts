import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/auth";
import { TransactionCategory, TransactionType } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ installmentId: string }> }
) {
  try {
    const user = await requireAgent(req);
    if (!user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { installmentId } = await params;
    const { amount, penaltyAmount, extraAmount, notes } = await req.json();

    // Validate required fields
    if (!amount) {
      return new NextResponse(JSON.stringify({ error: "Amount is required" }), {
        status: 400,
      });
    }

    // Get the installment
    const installment = await prisma.installment.findUnique({
      where: { id: installmentId },
      include: {
        loan: {
          include: {
            borrower: {
              include: {
                agent: true,
              },
            },
          },
        },
      },
    });

    if (!installment) {
      return new NextResponse(
        JSON.stringify({ error: "Installment not found" }),
        { status: 404 }
      );
    }

    // Verify agent has access to this borrower
    if (installment.loan.borrower.agent.userId !== user.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
      });
    }

    // Calculate total amount including penalty and extra
    const totalAmount =
      Number(amount) +
      (penaltyAmount ? Number(penaltyAmount) : 0) +
      (extraAmount ? Number(extraAmount) : 0);

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        amount: totalAmount,
        type: TransactionType.INSTALLMENT,
        category: TransactionCategory.INSTALLMENT,
        notes: notes || undefined,
        installmentId: installment.id,
      },
    });

    // Update installment status
    await prisma.installment.update({
      where: { id: installment.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error collecting payment:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
