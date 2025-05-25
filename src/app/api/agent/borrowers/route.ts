import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/auth";

// GET /api/agent/borrowers - Get all borrowers for the agent
export async function GET(request: NextRequest) {
  try {
    const user = await requireAgent(request);
    if (!user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Get the agent record
    const agent = await prisma.agent.findUnique({
      where: { userId: user.id },
    });

    if (!agent) {
      console.error("Agent not found for user:", user.id);
      return new NextResponse(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
      });
    }

    console.log("Fetching borrowers for agent:", agent.id);

    const borrowers = await prisma.borrower.findMany({
      where: {
        agentId: agent.id,
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
    });

    console.log("Found borrowers:", borrowers.length);

    // Transform the data to include active loans count and total amount
    const transformedBorrowers = borrowers.map((borrower) => ({
      id: borrower.id,
      name: borrower.name,
      phone: borrower.phone,
      activeLoans: borrower.loans.length,
      totalAmount: borrower.loans.reduce((sum, loan) => {
        const remainingInstallments = loan.installments.filter(
          (i) => i.status === "PENDING"
        );
        return (
          sum +
          remainingInstallments.reduce((total, inst) => total + inst.amount, 0)
        );
      }, 0),
    }));

    return NextResponse.json(transformedBorrowers);
  } catch (error) {
    console.error("Error fetching borrowers:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

// POST /api/agent/borrowers - Create a new borrower
export async function POST(request: NextRequest) {
  try {
    const agent = await requireAgent(request);
    if (!agent) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const body = await request.json();
    const { name, guarantorName, phone, address, panId } = body;

    // Validate required fields
    if (!name || !guarantorName || !phone || !address || !panId) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Validate PAN ID format
    const panIdRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panIdRegex.test(panId)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid PAN ID format" }),
        { status: 400 }
      );
    }

    // Check if PAN ID already exists
    const existingBorrower = await prisma.borrower.findUnique({
      where: { panId },
    });

    if (existingBorrower) {
      return new NextResponse(
        JSON.stringify({ error: "PAN ID already registered" }),
        { status: 400 }
      );
    }

    // Create new borrower
    const borrower = await prisma.borrower.create({
      data: {
        name,
        guarantorName,
        phone,
        address,
        panId,
        agentId: agent.id,
      },
    });

    return NextResponse.json(borrower);
  } catch (error) {
    console.error("Error creating borrower:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
