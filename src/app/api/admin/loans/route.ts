import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const loans = await prisma.loan.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        borrower: {
          select: {
            name: true,
            phone: true,
          },
        },
        installments: {
          orderBy: {
            dueDate: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(loans);
  } catch (error) {
    console.error("Error fetching loans:", error);
    return NextResponse.json(
      { error: "Failed to fetch loans" },
      { status: 500 }
    );
  }
}
