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

    const installment = await prisma.installment.findUnique({
      where: { id },
      include: {
        loan: {
          include: {
            borrower: {
              select: {
                name: true,
                phone: true,
                agent: {
                  select: {
                    user: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!installment) {
      return NextResponse.json(
        { error: "Installment not found" },
        { status: 404 }
      );
    }

    // Format the response
    const formattedInstallment = {
      id: installment.id,
      loanId: installment.loanId,
      amount: installment.amount,
      principal: installment.principal,
      interest: installment.interest,
      installmentAmount: installment.installmentAmount,
      dueDate: installment.dueDate,
      status: installment.status,
      penaltyAmount: installment.penaltyAmount,
      extraAmount: installment.extraAmount,
      dueAmount: installment.dueAmount,
      paidAt: installment.paidAt,
      createdAt: installment.createdAt,
      borrowerName: (installment as any).loan.borrower.name,
      borrowerPhone: (installment as any).loan.borrower.phone,
      agentName: (installment as any).loan.borrower.agent.user.name,
      frequency: (installment as any).loan.frequency,
    };

    return NextResponse.json(formattedInstallment);
  } catch (error) {
    console.error("Error fetching installment:", error);
    return NextResponse.json(
      { error: "Failed to fetch installment" },
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
    const body = await req.json();

    const {
      amount,
      principal,
      interest,
      installmentAmount,
      dueDate,
      status,
      penaltyAmount,
      extraAmount,
      dueAmount,
      paidAt,
    } = body;

    // Check if installment exists
    const existingInstallment = await prisma.installment.findUnique({
      where: { id },
    });

    if (!existingInstallment) {
      return NextResponse.json(
        { error: "Installment not found" },
        { status: 404 }
      );
    }

    // Build update data object
    const updateData: any = {};

    if (amount !== undefined) updateData.amount = Number(amount);
    if (principal !== undefined) updateData.principal = Number(principal);
    if (interest !== undefined) updateData.interest = Number(interest);
    if (installmentAmount !== undefined)
      updateData.installmentAmount = Number(installmentAmount);
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (status !== undefined) updateData.status = status;
    if (penaltyAmount !== undefined)
      updateData.penaltyAmount = Number(penaltyAmount);
    if (extraAmount !== undefined) updateData.extraAmount = Number(extraAmount);
    if (dueAmount !== undefined) updateData.dueAmount = Number(dueAmount);
    if (paidAt !== undefined)
      updateData.paidAt = paidAt ? new Date(paidAt) : null;

    // Update the installment
    const updatedInstallment = await prisma.installment.update({
      where: { id },
      data: updateData,
      include: {
        loan: {
          include: {
            borrower: {
              select: {
                name: true,
                phone: true,
                agent: {
                  select: {
                    user: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Format the response
    const formattedInstallment = {
      id: updatedInstallment.id,
      loanId: updatedInstallment.loanId,
      amount: updatedInstallment.amount,
      principal: updatedInstallment.principal,
      interest: updatedInstallment.interest,
      installmentAmount: updatedInstallment.installmentAmount,
      dueDate: updatedInstallment.dueDate,
      status: updatedInstallment.status,
      penaltyAmount: updatedInstallment.penaltyAmount,
      extraAmount: updatedInstallment.extraAmount,
      dueAmount: updatedInstallment.dueAmount,
      paidAt: updatedInstallment.paidAt,
      createdAt: updatedInstallment.createdAt,
      borrowerName: (updatedInstallment as any).loan.borrower.name,
      borrowerPhone: (updatedInstallment as any).loan.borrower.phone,
      agentName: (updatedInstallment as any).loan.borrower.agent.user.name,
      frequency: (updatedInstallment as any).loan.frequency,
    };

    return NextResponse.json(formattedInstallment);
  } catch (error) {
    console.error("Error updating installment:", error);
    return NextResponse.json(
      { error: "Failed to update installment" },
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

    // Check if installment exists
    const existingInstallment = await prisma.installment.findUnique({
      where: { id },
    });

    if (!existingInstallment) {
      return NextResponse.json(
        { error: "Installment not found" },
        { status: 404 }
      );
    }

    // Delete the installment
    await prisma.installment.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Installment deleted successfully" });
  } catch (error) {
    console.error("Error deleting installment:", error);
    return NextResponse.json(
      { error: "Failed to delete installment" },
      { status: 500 }
    );
  }
}
