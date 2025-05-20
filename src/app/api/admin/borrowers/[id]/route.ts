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

    // Get borrower details with agent and loans information
    const borrower = await prisma.borrower.findUnique({
      where: { id },
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
        loans: {
          orderBy: {
            startDate: "asc",
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
    });

    if (!borrower) {
      return NextResponse.json(
        { error: "Borrower not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(borrower);
  } catch (error) {
    console.error("Error fetching borrower:", error);
    return NextResponse.json(
      { error: "Failed to fetch borrower" },
      { status: 500 }
    );
  }
}
