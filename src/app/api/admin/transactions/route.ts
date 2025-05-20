import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { TransactionType, TransactionCategory } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { amount, type, category, notes, installmentId } = await req.json();

    console.log(amount, type, category, notes, installmentId);

    // Validate required fields
    if (!amount || !type) {
      return NextResponse.json(
        { error: "Amount and type are required" },
        { status: 400 }
      );
    }

    // Validate transaction type
    const validTypes = Object.values(TransactionType);
    if (!validTypes.includes(type as TransactionType)) {
      return NextResponse.json(
        {
          error: `Invalid transaction type. Must be one of: ${validTypes.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        amount: Number(amount),
        type: type as TransactionType,
        category: (category ||
          TransactionCategory.OTHER) as TransactionCategory,
        notes: notes || undefined,
        installmentId: installmentId || undefined,
      },
      include: {
        installment: true,
      },
    });

    // If this is a payment and has an installment, update the installment status
    if (type === TransactionType.INSTALLMENT && installmentId) {
      await prisma.installment.update({
        where: { id: installmentId },
        data: { status: "PAID" },
      });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const loanId = searchParams.get("loanId");
    const type = searchParams.get("type");

    // Build the where clause
    const where: Record<string, string | null> = {};

    if (loanId) where.loanId = loanId;
    if (type) where.type = type;

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        installment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
