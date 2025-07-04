import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Verify admin access
    requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Build search conditions
    const searchConditions = search
      ? {
          OR: [
            {
              loan: {
                borrower: {
                  name: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
            {
              loan: {
                borrower: {
                  phone: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
            // Add numeric search for amounts
            ...(Number(search) && !isNaN(Number(search))
              ? [
                  {
                    amount: {
                      gte: Number(search) - 1,
                      lte: Number(search) + 1,
                    },
                  },
                  {
                    principal: {
                      gte: Number(search) - 1,
                      lte: Number(search) + 1,
                    },
                  },
                  {
                    interest: {
                      gte: Number(search) - 1,
                      lte: Number(search) + 1,
                    },
                  },
                ]
              : []),
          ],
        }
      : {};

    // Get total count for pagination
    const totalCount = await prisma.installment.count({
      where: searchConditions,
    });

    // Get installments with pagination
    const installments = await prisma.installment.findMany({
      where: searchConditions,
      include: {
        loan: {
          include: {
            borrower: {
              select: {
                name: true,
                phone: true,
                agent: {
                  select: {
                    user: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Format the response
    const formattedInstallments = installments.map((installment) => ({
      id: installment.id,
      loanId: installment.loanId,
      amount: installment.amount,
      principal: installment.principal,
      interest: installment.interest,
      installmentAmount: installment.installmentAmount,
      dueDate: installment.dueDate,
      status: installment.status,
      penaltyAmount: installment.penaltyAmount,
      extraAmount: installment.extraAmount,
      dueAmount: installment.dueAmount,
      paidAt: installment.paidAt,
      createdAt: installment.createdAt,
      borrowerName: installment.loan.borrower.name,
      borrowerPhone: installment.loan.borrower.phone,
      agentName: installment.loan.borrower.agent.user.name,
      frequency: installment.loan.frequency,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      installments: formattedInstallments,
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
    console.error("Error fetching installments:", error);
    return NextResponse.json(
      { error: "Failed to fetch installments" },
      { status: 500 }
    );
  }
}
