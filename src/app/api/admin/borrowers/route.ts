import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    // Build the where clause
    const where: Record<string, unknown> = {};

    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ];
    }

    const borrowers = await prisma.borrower.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        agent: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const loans = await prisma.loan.findMany({
      where: {
        borrowerId: { in: borrowers.map((borrower) => borrower.id) },
      },
    });

    const borrowersWithLoans = borrowers.map((borrower) => ({
      ...borrower,
      loans: loans.filter((loan) => loan.borrowerId === borrower.id),
    }));

    return NextResponse.json(borrowersWithLoans);
  } catch (error) {
    console.error("Error fetching borrowers:", error);
    return NextResponse.json(
      { error: "Failed to fetch borrowers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    requireAdmin(request as NextRequest);

    const data = await request.json();
    const { name, fatherName, phone, address, panId, agentId } = data;

    // Validate required fields
    if (!name || !fatherName || !phone || !address || !panId || !agentId) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Create borrower
    const borrower = await prisma.borrower.create({
      data: {
        name,
        fatherName,
        phone,
        address,
        panId,
        agentId,
      },
      include: {
        agent: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(borrower);
  } catch (error) {
    console.error("Error creating borrower:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
