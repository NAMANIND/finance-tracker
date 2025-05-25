import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { TransactionType, TransactionCategory } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const {
      amount,
      type,
      category,
      notes,
      name,
      installmentId,
      addedBy,
      penaltyAmount,
      extraAmount,
      dueAmount,
      interest,
    } = await req.json();

    console.log(
      amount,
      type,
      category,
      notes,
      name,
      installmentId,
      addedBy,
      penaltyAmount,
      extraAmount,
      dueAmount,
      interest
    );

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

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    // Calculate total amount including penalty and extra
    const totalAmount =
      Number(amount) + (extraAmount ? Number(extraAmount) : 0);

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        amount: totalAmount,
        type: type as TransactionType,
        category: category as TransactionCategory,
        notes: notes || undefined,
        installmentId: installmentId || undefined,
        name: name || undefined,
        addedBy: addedBy || undefined,
        penaltyAmount: penaltyAmount ? Number(penaltyAmount) : 0,
        extraAmount: extraAmount ? Number(extraAmount) : 0,
        interest: interest ? Number(interest) : 0,
      },
      include: {
        installment: true,
      },
    });

    // If this is a payment and has an installment, update the installment status
    if (type === TransactionType.INSTALLMENT && installmentId) {
      await prisma.installment.update({
        where: { id: installmentId },
        data: {
          status: "PAID",
          dueAmount: dueAmount ? Number(dueAmount) : 0,
          penaltyAmount: penaltyAmount ? Number(penaltyAmount) : 0,
          extraAmount: extraAmount ? Number(extraAmount) : 0,
          paidAt: new Date(),
        },
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
