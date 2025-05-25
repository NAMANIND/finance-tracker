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

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            idProof: true,
          },
        },
        borrowers: {
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
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error("Error fetching agent details:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    requireAdmin(req);

    const { id } = await params;
    const data = await req.json();
    const { name, email, phone, address, idProof } = data;

    // Update agent's user information
    const updatedAgent = await prisma.agent.update({
      where: { id },
      data: {
        user: {
          update: {
            name,
            email,
            phone,
            address,
            idProof,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            idProof: true,
          },
        },
      },
    });

    return NextResponse.json(updatedAgent);
  } catch (error) {
    console.error("Error updating agent:", error);
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    requireAdmin(req);

    const { id } = await params;

    // First check if agent has any borrowers
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        borrowers: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (agent.borrowers.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete agent with assigned borrowers" },
        { status: 400 }
      );
    }

    // Delete the agent and their associated user
    await prisma.agent.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Agent deleted successfully" });
  } catch (error) {
    console.error("Error deleting agent:", error);
    return NextResponse.json(
      { error: "Failed to delete agent" },
      { status: 500 }
    );
  }
}
