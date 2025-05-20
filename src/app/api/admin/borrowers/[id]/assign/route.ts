import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    requireAdmin(req);

    const { id } = await params;
    const { agentId } = await req.json();

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    // Update borrower's agent
    const borrower = await prisma.borrower.update({
      where: { id },
      data: { agentId },
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
    console.error("Error assigning borrower to agent:", error);
    return NextResponse.json(
      { error: "Failed to assign borrower to agent" },
      { status: 500 }
    );
  }
}
