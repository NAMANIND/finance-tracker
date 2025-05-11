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
    // Verify admin access
    requireAdmin(req);

    const { id } = params;
    const data = await req.json();
    const { name, fatherName, phone, address, panId } = data;

    // Create a new borrower associated with the agent
    const borrower = await prisma.borrower.create({
      data: {
        name,
        fatherName,
        phone,
        address,
        panId,
        agentId: id,
      },
      include: {
        loans: true,
      },
    });

    return NextResponse.json(borrower);
  } catch (error) {
    console.error("Error creating borrower:", error);
    return NextResponse.json(
      { error: "Failed to create borrower" },
      { status: 500 }
    );
  }
}
