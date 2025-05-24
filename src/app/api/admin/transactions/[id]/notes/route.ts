import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { id } = await params;
    const { notes } = await req.json();

    // Update the transaction notes
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: { notes },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error("Error updating transaction notes:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to update transaction notes" }),
      { status: 500 }
    );
  }
}
