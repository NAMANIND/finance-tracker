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
    const { amount, penaltyAmount, extraAmount, notes, dueAmount, interest } =
      await req.json();

    // Get agent details from database
    const agentDetails = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true },
    });

    if (!agentDetails) {
      return new NextResponse(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
      });
    }

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
      Number(amount) + (extraAmount ? Number(extraAmount) : 0);

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        amount: totalAmount,
        type: TransactionType.INSTALLMENT,
        category: TransactionCategory.INSTALLMENT,
        notes: notes || undefined,
        name: installment.loan.borrower.name,
        addedBy: agentDetails.name || "AGENT",
        installmentId: installment.id,
        extraAmount: extraAmount || 0,
        penaltyAmount: penaltyAmount || 0,
        interest: interest || 0,
      },
    });

    // Update installment status
    const installmentUpdated = await prisma.installment.update({
      where: { id: installment.id },
      data: {
        status: "PAID",
        dueAmount: dueAmount,
        extraAmount: extraAmount || 0,
        penaltyAmount: penaltyAmount || 0,
        paidAt: new Date(),
      },
    });

    if (amount === 0) {
      // check if the loan is monthly or weekly
      const loan = await prisma.loan.findUnique({
        where: { id: installmentUpdated.loanId },
      });
      if (loan?.frequency === "MONTHLY") {
        // update the transaction amount
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            amount:
              installmentUpdated.interest + installmentUpdated.extraAmount,
          },
        });
      }
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error collecting payment:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
