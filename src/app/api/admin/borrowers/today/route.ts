import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);

    // Create start of today in IST (UTC+5:30)
    const today = new Date();
    // Convert to IST by adding 5 hours and 30 minutes
    today.setUTCHours(
      today.getUTCHours() + 5,
      today.getUTCMinutes() + 30,
      0,
      0
    );
    // Set to start of day
    today.setUTCHours(0, 0, 0, 0);

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
