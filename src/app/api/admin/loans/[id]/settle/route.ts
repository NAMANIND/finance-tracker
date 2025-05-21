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

    const loanId = (await params).id;
    if (!loanId) {
      return NextResponse.json(
        { error: "Loan ID is required" },
        { status: 400 }
      );
    }

    const { markPendingAsPaid } = await req.json();

    // Get the loan and its installments
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        installments: true,
        borrower: true,
      },
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    if (loan.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Only active loans can be settled" },
        { status: 400 }
      );
    }

    // Calculate remaining amount
    const totalAmount = loan.principalAmount;
    const collectedAmount = loan.installments.reduce(
      (sum, inst) => sum + inst.amount + inst.extraAmount + inst.penaltyAmount,
      0
    );
    const remainingAmount = totalAmount - collectedAmount;

    // If there are pending installments and markPendingAsPaid is true
    if (markPendingAsPaid) {
      const pendingInstallments = loan.installments.filter(
        (inst) => inst.status !== "PAID"
      );

      // Update all pending installments to PAID and create transactions
      for (const installment of pendingInstallments) {
        await prisma.$transaction([
          // Update installment status
          prisma.installment.update({
            where: { id: installment.id },
            data: {
              status: "PAID",
              paidAt: new Date(),
            },
          }),
          // Create transaction for the installment
          prisma.transaction.create({
            data: {
              amount:
                installment.amount +
                installment.extraAmount +
                installment.penaltyAmount,
              type: "INSTALLMENT",
              category: "INSTALLMENT",
              notes: `Final settlement for loan ${loan.id}`,
              installmentId: installment.id,
            },
          }),
        ]);
      }
    } else if (remainingAmount > 0) {
      // If not marking pending as paid and there's remaining amount, create a final installment
      const finalInstallment = await prisma.installment.create({
        data: {
          loanId: loan.id,
          dueDate: new Date(),
          amount: remainingAmount,
          principal: remainingAmount,
          interest: 0,
          installmentAmount: remainingAmount,
          extraAmount: 0,
          penaltyAmount: 0,
          status: "PAID",
          paidAt: new Date(),
        },
      });

      // Create transaction for the final installment
      await prisma.transaction.create({
        data: {
          amount: remainingAmount,
          type: "INSTALLMENT",
          category: "INSTALLMENT",
          notes: `Final settlement for loan ${loan.id}`,
          installmentId: finalInstallment.id,
        },
      });
    }

    // Update loan status to SETTLED
    await prisma.loan.update({
      where: { id: loanId },
      data: { status: "SETTLED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error settling loan:", error);
    return NextResponse.json(
      { error: "Failed to settle loan" },
      { status: 500 }
    );
  }
}
