import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/auth";

// POST /api/agent/borrowers/[id]/loans - Create a new loan for a borrower
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await requireAgent(request);
    if (!agent) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Verify borrower belongs to agent
    const borrower = await prisma.borrower.findFirst({
      where: {
        id: (await params).id,
        agentId: agent.id,
      },
    });

    if (!borrower) {
      return new NextResponse(JSON.stringify({ error: "Borrower not found" }), {
        status: 404,
      });
    }

    const body = await request.json();
    const { principalAmount, interestRate, duration, startDate } = body;

    // Validate required fields
    if (!principalAmount || !interestRate || !duration || !startDate) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Calculate number of installments
    const numInstallments = duration;

    // Calculate installment amounts
    const totalInterest = (principalAmount * interestRate * duration) / 100;
    const principalPerInstallment = principalAmount / numInstallments;
    const interestPerInstallment = totalInterest / numInstallments;

    // Create loan with installments
    const loan = await prisma.loan.create({
      data: {
        borrowerId: (await params).id,
        principalAmount: Number(principalAmount),
        interestRate: Number(interestRate),
        duration: Number(duration),
        startDate: new Date(startDate),
        status: "ACTIVE",
        frequency: "MONTHLY",
        installments: {
          create: Array.from({ length: numInstallments }, (_, i) => ({
            principal: principalPerInstallment,
            interest: interestPerInstallment,
            installmentAmount: principalPerInstallment,
            amount: principalPerInstallment + interestPerInstallment,
            dueDate: new Date(
              new Date(startDate).setMonth(
                new Date(startDate).getMonth() + i + 1
              )
            ),
            status: "PENDING",
          })),
        },
      },
      include: {
        installments: true,
      },
    });

    return NextResponse.json(loan);
  } catch (error) {
    console.error("Error creating loan:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
