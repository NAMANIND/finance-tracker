import { PrismaClient, UserRole, PaymentFrequency } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seeding...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      password: adminPassword,
      phone: "1234567890",
      address: "123 Admin Street, City",
      idProof: "ADMIN123456",
      role: UserRole.ADMIN,
    },
  });
  console.log("Admin user created:", admin);

  // Create 2 agents
  const agents = [];
  for (let i = 1; i <= 2; i++) {
    const agentPassword = await bcrypt.hash(`agent${i}123`, 10);
    const user = await prisma.user.upsert({
      where: { email: `agent${i}@example.com` },
      update: {},
      create: {
        email: `agent${i}@example.com`,
        name: `Agent ${i}`,
        password: agentPassword,
        phone: `9876543${i}00`,
        address: `${i}00 Agent Avenue, City`,
        idProof: `AGENT${i}123456`,
        role: UserRole.AGENT,
      },
    });

    const agent = await prisma.agent.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
      },
    });
    agents.push(agent);
    console.log(`Agent ${i} created:`, agent);
  }

  // Create 5 borrowers (3 for agent 1, 2 for agent 2)
  const borrowers = [];
  for (let i = 1; i <= 5; i++) {
    const agentIndex = i <= 3 ? 0 : 1; // First 3 borrowers for agent 1, last 2 for agent 2
    const borrower = await prisma.borrower.upsert({
      where: { panId: `PAN${i}123456` },
      update: {
        name: `Borrower ${i}`,
        guarantorName: `Father of Borrower ${i}`,
        phone: `9876543${i}00`,
        address: `${i}00 Borrower Street, City`,
        agentId: agents[agentIndex].id,
      },
      create: {
        name: `Borrower ${i}`,
        guarantorName: `Father of Borrower ${i}`,
        phone: `9876543${i}00`,
        address: `${i}00 Borrower Street, City`,
        panId: `PAN${i}123456`,
        agentId: agents[agentIndex].id,
      },
    });
    borrowers.push(borrower);
    console.log(`Borrower ${i} created:`, borrower);

    // Create a loan for each borrower
    const loan = await prisma.loan.create({
      data: {
        borrowerId: borrower.id,
        principalAmount: 10000 * i, // Different amounts for each borrower
        interestRate: 12.5, // 12.5% interest rate
        startDate: new Date(),
        duration: 12, // 12 months
        frequency: PaymentFrequency.MONTHLY,
        status: "ACTIVE",
      },
    });
    console.log(`Loan for Borrower ${i} created:`, loan);

    // Calculate installment amounts
    const totalInterest =
      (loan.principalAmount * loan.interestRate * loan.duration) / 100;
    const principalPerInstallment = loan.principalAmount / loan.duration;
    const interestPerInstallment = totalInterest / loan.duration;

    // Create installments for each loan
    for (let j = 1; j <= 3; j++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + j);

      const installment = await prisma.installment.create({
        data: {
          loanId: loan.id,
          dueDate,
          principal: principalPerInstallment,
          interest: interestPerInstallment,
          installmentAmount: principalPerInstallment,
          amount: principalPerInstallment + interestPerInstallment,
          status: "PENDING",
        },
      });
      console.log(`Installment ${j} for Loan ${loan.id} created:`, installment);
    }
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
