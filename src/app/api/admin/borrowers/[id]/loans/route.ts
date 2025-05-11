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
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    requireAdmin(req);

    const body = await req.json();
    const { principalAmount, interestRate, termMonths, startDate, frequency } =
      body;

    // Validate required fields
    if (
      !principalAmount ||
      !interestRate ||
      !termMonths ||
      !startDate ||
      !frequency
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

    // Create loan with installments
    const loan = await prisma.loan.create({
      data: {
        borrowerId: params.id,
        principalAmount: Number(principalAmount),
        interestRate: Number(interestRate),
        duration: Number(termMonths),
        startDate: new Date(startDate),
        status: "ACTIVE",
        frequency: frequency as PaymentFrequency,
        installments: {
          create: Array.from({ length: numInstallments }, (_, i) => {
            const dueDate = new Date(startDate);
            if (frequency === PaymentFrequency.DAILY) {
              dueDate.setDate(dueDate.getDate() + i + 1);
            } else if (frequency === PaymentFrequency.WEEKLY) {
              dueDate.setDate(dueDate.getDate() + (i + 1) * 7);
            } else {
              dueDate.setMonth(dueDate.getMonth() + i + 1);
            }
            return {
              principal: principalPerInstallment,
              interest: interestPerInstallment,
              installmentAmount: principalPerInstallment,
              amount: principalPerInstallment + interestPerInstallment,
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

    return NextResponse.json(loan);
  } catch (error) {
    console.error("Error creating loan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
