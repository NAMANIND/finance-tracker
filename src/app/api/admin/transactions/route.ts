import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { TransactionType, TransactionCategory, Prisma } from "@prisma/client";

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
      transactionDate,
      installmentDate,
    } = await req.json();

    // console.log(
    //   amount,
    //   type,
    //   category,
    //   notes,
    //   name,
    //   installmentId,
    //   addedBy,
    //   penaltyAmount,
    //   extraAmount,
    //   dueAmount,
    //   interest,
    //   transactionDate,
    //   installmentDate
    // );

    // Validate required fields
    if (amount < 0 || !type) {
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
        createdAt:
          type === TransactionType.INSTALLMENT
            ? new Date(installmentDate)
            : new Date(transactionDate),
      },
      include: {
        installment: true,
      },
    });

    // If this is a payment and has an installment, update the installment status
    if (type === TransactionType.INSTALLMENT && installmentId) {
      const installment = await prisma.installment.update({
        where: { id: installmentId },
        data: {
          status: "PAID",
          dueAmount: dueAmount ? Number(dueAmount) : 0,
          penaltyAmount: penaltyAmount ? Number(penaltyAmount) : 0,
          extraAmount: extraAmount ? Number(extraAmount) : 0,
          paidAt: installmentDate ? new Date(installmentDate) : new Date(),
        },
      });

      if (amount === 0) {
        // check if the loan is monthly or weekly
        const loan = await prisma.loan.findUnique({
          where: { id: installment.loanId },
        });
        if (loan?.frequency === "MONTHLY") {
          // update the transaction amount
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              amount: installment.interest + installment.extraAmount,
            },
          });
        }
      }
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
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build the where clause
    const where: Prisma.TransactionWhereInput = {};

    if (loanId) {
      where.installment = {
        loanId: loanId,
      };
    }
    if (type) where.type = type as TransactionType;

    // Add search functionality - only search by name
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.name = { contains: searchTerm, mode: "insensitive" };
    }

    // Get total count for pagination
    const totalCount = await prisma.transaction.count({
      where,
    });

    // Get transactions with pagination
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        installment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limit,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      transactions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
