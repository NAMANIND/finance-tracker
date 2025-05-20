import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const borrowers = await prisma.borrower.findMany({
      where: {
        createdAt: {
          gte: today,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(borrowers);
  } catch (error) {
    console.error("Error fetching today's borrowers:", error);
    return NextResponse.json(
      { error: "Failed to fetch today's borrowers" },
      { status: 500 }
    );
  }
}
