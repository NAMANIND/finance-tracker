import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PaymentFrequency } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    requireAdmin(req);

    // Ensure params.id is available
    const borrowerId = (await params).id;
    if (!borrowerId) {
      return NextResponse.json(
        { error: "Borrower ID is required" },
        { status: 400 }
      );
    }

    // Get all loans for the borrower
    const loans = await prisma.loan.findMany({
      where: {
        borrowerId: borrowerId,
      },
      include: {
        borrower: {
          select: {
            name: true,
            phone: true,
          },
        },
        installments: {
          orderBy: {
            dueDate: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Add borrowerName to each loan for easier access in the frontend
    const loansWithBorrowerName = loans.map((loan) => ({
      ...loan,
      borrowerName: loan.borrower.name,
    }));

    return NextResponse.json(loansWithBorrowerName);
  } catch (error) {
    console.error("Error fetching loans:", error);
    return NextResponse.json(
      { error: "Failed to fetch loans" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    requireAdmin(req);

    const body = await req.json();
    const {
      principalAmount,
      interestRate,
      termMonths,
      startDate,
      frequency,
      createdAt,
    } = body;

    // Validate required fields
    if (
      !principalAmount ||
      !interestRate ||
      !termMonths ||
      !startDate ||
      !frequency ||
      !createdAt
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate number of installments based on frequency
    let numInstallments = termMonths;
    if (frequency === PaymentFrequency.WEEKLY) {
      numInstallments = termMonths * 4; // 4 weeks per month
    } else if (frequency === PaymentFrequency.DAILY) {
      numInstallments = termMonths * 30; // 30 days per month
    }

    // Calculate installment amounts
    const totalInterest = (principalAmount * interestRate * termMonths) / 100;
    const principalPerInstallment = principalAmount / numInstallments;
    const interestPerInstallment = totalInterest / numInstallments;

    let loan;

    // Create loan with installments and transaction in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create loan with installments
      // fetch the borrower for that if
      const borrower = await tx.borrower.findUnique({
        where: {
          id: (await params).id,
        },
      });

      if (frequency === PaymentFrequency.MONTHLY) {
        loan = await tx.loan.create({
          data: {
            borrowerId: (await params).id,
            principalAmount: Number(principalAmount),
            interestRate: Number(interestRate),
            duration: Number(termMonths),
            startDate: new Date(startDate),
            status: "ACTIVE",
            frequency: frequency as PaymentFrequency,
            createdAt: new Date(createdAt),
            installments: {
              create: {
                principal: 0,
                interest: Number(interestPerInstallment.toFixed(2)),
                installmentAmount: 0,
                amount: 0,
                dueDate: new Date(startDate),
                status: "PENDING",
              },
            },
          },
          include: {
            installments: true,
          },
        });
      } else {
        loan = await tx.loan.create({
          data: {
            borrowerId: (await params).id,
            principalAmount: Number(principalAmount),
            interestRate: Number(interestRate),
            duration: Number(termMonths),
            startDate: new Date(startDate),
            status: "ACTIVE",
            frequency: frequency as PaymentFrequency,
            createdAt: new Date(createdAt),
            installments: {
              create: Array.from({ length: numInstallments }, (_, i) => {
                const dueDate = new Date(startDate);
                if (frequency === PaymentFrequency.DAILY) {
                  dueDate.setDate(dueDate.getDate() + i);
                } else if (frequency === PaymentFrequency.WEEKLY) {
                  dueDate.setDate(dueDate.getDate() + i * 7);
                } else {
                  dueDate.setMonth(dueDate.getMonth() + i);
                }

                const isDaily = frequency === PaymentFrequency.DAILY;
                return {
                  principal: Number(
                    (isDaily
                      ? principalPerInstallment
                      : principalPerInstallment - interestPerInstallment
                    ).toFixed(2)
                  ),
                  interest: Number(interestPerInstallment.toFixed(2)),
                  installmentAmount: Number(
                    (isDaily
                      ? principalPerInstallment + interestPerInstallment
                      : principalPerInstallment
                    ).toFixed(2)
                  ),
                  amount: Number(
                    (isDaily
                      ? principalPerInstallment + interestPerInstallment
                      : principalPerInstallment
                    ).toFixed(2)
                  ),
                  dueDate,
                  status: "PENDING",
                };
              }),
            },
          },
          include: {
            installments: true,
          },
        });
      }
      // Create transaction record for the loan
      await tx.transaction.create({
        data: {
          amount:
            frequency === PaymentFrequency.DAILY ||
            frequency === PaymentFrequency.MONTHLY
              ? Number(principalAmount)
              : Number(principalAmount) *
                (1 - (Number(interestRate) * Number(termMonths)) / 100),
          type: "EXPENSE",
          category: "LOAN",
          notes: `Loan disbursement for ${borrower?.name} Loan ID: ${loan.id}`,
          name: borrower?.name,
          addedBy: "ADMIN",
          installmentId: loan.installments[0].id,
          createdAt: new Date(createdAt),
        },
      });

      return loan;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating loan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
