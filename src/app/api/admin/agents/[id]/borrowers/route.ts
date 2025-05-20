import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    requireAdmin(req);

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    // Get agent's borrowers with search functionality
    const borrowers = await prisma.borrower.findMany({
      where: {
        agentId: id,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { address: { contains: search, mode: "insensitive" } },
        ],
      },
      include: {
        loans: {
          where: {
            status: "ACTIVE",
          },
          include: {
            installments: {
              orderBy: {
                dueDate: "asc",
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(borrowers);
  } catch (error) {
    console.error("Error fetching agent's borrowers:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent's borrowers" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(req);

    const body = await req.json();
    const { borrowerIds, agentId } = body;

    if (
      !borrowerIds ||
      !Array.isArray(borrowerIds) ||
      borrowerIds.length === 0
    ) {
      return NextResponse.json(
        { message: "No borrower IDs provided" },
        { status: 400 }
      );
    }

    if (!agentId) {
      return NextResponse.json(
        { message: "Agent ID is required" },
        { status: 400 }
      );
    }

    // Update all selected borrowers to be associated with this agent
    const updatedBorrowers = await prisma.borrower.updateMany({
      where: {
        id: {
          in: borrowerIds,
        },
      },
      data: {
        agentId: agentId,
      },
    });

    return NextResponse.json({
      message: "Borrowers assigned successfully",
      count: updatedBorrowers.count,
    });
  } catch (error) {
    console.error("Error assigning borrowers:", error);
    return NextResponse.json(
      { message: "Failed to assign borrowers" },
      { status: 500 }
    );
  }
}
