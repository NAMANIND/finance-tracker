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

    const {
      markPendingAsPaid,
      extraAmount,
      penaltyAmount,
      amount,
      interest,
      settlementType,
      settlementDate,
    } = await req.json();

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

    if (settlementType === "AUTOMATIC") {
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
                status: "SKIPPED",
                paidAt: settlementDate ? new Date(settlementDate) : new Date(),
              },
            }),
          ]);
        }
      } else if (amount > 0) {
        // If not marking pending as paid and there's remaining amount, create a final installment
        await prisma.installment.create({
          data: {
            loanId: loan.id,
            dueDate: new Date(),
            amount: amount,
            principal: amount,
            interest: interest || 0,
            installmentAmount: amount,
            extraAmount: extraAmount || 0,
            penaltyAmount: 0,
            status: "PAID",
            paidAt: settlementDate ? new Date(settlementDate) : new Date(),
          },
        });
      }
    } else if (settlementType === "MANUAL") {
      // get the instlaments which are not paid
      const unpaidInstallments = loan.installments.filter(
        (inst) => inst.status !== "PAID"
      );

      // update the unpaid installments to PAID
      // update all of there staute to cancelled
      await prisma.installment.updateMany({
        where: { id: { in: unpaidInstallments.map((inst) => inst.id) } },
        data: {
          status: "SKIPPED",
          paidAt: settlementDate ? new Date(settlementDate) : new Date(),
        },
      });

      // make a new installment with the amount
      await prisma.installment.create({
        data: {
          loanId: loan.id,
          dueDate: new Date(),
          amount: amount,
          principal: amount,
          interest: interest || 0,
          installmentAmount: amount,
          extraAmount: extraAmount || 0,
          penaltyAmount: penaltyAmount || 0,
          status: "PAID",
          paidAt: settlementDate ? new Date(settlementDate) : new Date(),
        },
      });
    }

    // Create transaction for the final installment
    await prisma.transaction.create({
      data: {
        amount: amount,
        penaltyAmount: penaltyAmount || 0,
        extraAmount: extraAmount || 0,
        type: "INSTALLMENT",
        category: "LOAN",
        notes: `Final settlement for ${loan.borrower.name} Loan ID: ${loan.id}`,
        installmentId: loan.installments[loan.installments.length - 1].id,
        name: loan.borrower.name + " -  SETTLED",
        interest: interest || 0,
        addedBy: "ADMIN",
        createdAt: settlementDate ? new Date(settlementDate) : new Date(),
      },
    });

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
