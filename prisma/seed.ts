import {
  PrismaClient,
  UserRole,
  PaymentFrequency,
  PaymentStatus,
  TransactionType,
  TransactionCategory,
} from "@prisma/client";
import { hash } from "bcryptjs";
import { addDays, subMonths, format, subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      password: adminPassword,
      role: UserRole.ADMIN,
      phone: "1234567890",
      address: "123 Admin St",
      idProof: "ADMIN123",
    },
  });

  // Create agent user
  const agentPassword = await hash("agent123", 12);
  const agent = await prisma.user.upsert({
    where: { email: "agent@example.com" },
    update: {},
    create: {
      email: "agent@example.com",
      name: "Agent User",
      password: agentPassword,
      role: UserRole.AGENT,
      phone: "9876543210",
      address: "456 Agent St",
      idProof: "AGENT123",
    },
  });

  // Create agent record
  const agentRecord = await prisma.agent.create({
    data: {
      userId: agent.id,
    },
  });

  // Create borrowers with loans and transactions
  const borrowers = [
    {
      name: "John Doe",
      fatherName: "James Doe",
      phone: "1234567890",
      address: "123 Main St",
      panId: "ABCDE1234F",
      loans: [
        {
          principalAmount: 50000,
          interestRate: 2,
          startDate: subMonths(new Date(), 6), // Started 6 months ago
          duration: 6,
          frequency: PaymentFrequency.MONTHLY,
          status: "ACTIVE",
          installments: [
            {
              principal: 8333.33,
              interest: 833.33,
              installmentAmount: 8333.33,
              amount: 9166.66,
              dueDate: subDays(new Date(), 150),
              status: PaymentStatus.PAID,
              paidAt: subDays(new Date(), 145),
            },
            {
              principal: 8333.33,
              interest: 833.33,
              installmentAmount: 8333.33,
              amount: 9166.66,
              dueDate: subDays(new Date(), 120),
              status: PaymentStatus.PAID,
              paidAt: subDays(new Date(), 115),
            },
            {
              principal: 8333.33,
              interest: 833.33,
              installmentAmount: 8333.33,
              amount: 9166.66,
              dueDate: subDays(new Date(), 90),
              status: PaymentStatus.PAID,
              paidAt: subDays(new Date(), 85),
            },
            {
              principal: 8333.33,
              interest: 833.33,
              installmentAmount: 8333.33,
              amount: 9166.66,
              dueDate: subDays(new Date(), 60),
              status: PaymentStatus.PAID,
              paidAt: subDays(new Date(), 55),
            },
            {
              principal: 8333.33,
              interest: 833.33,
              installmentAmount: 8333.33,
              amount: 9166.66,
              dueDate: subDays(new Date(), 30),
              status: PaymentStatus.PAID,
              paidAt: subDays(new Date(), 25),
            },
            {
              principal: 8333.33,
              interest: 833.33,
              installmentAmount: 8333.33,
              amount: 9166.66,
              dueDate: new Date(),
              status: PaymentStatus.PENDING,
            },
          ],
        },
      ],
    },
    {
      name: "Jane Smith",
      fatherName: "John Smith",
      phone: "9876543210",
      address: "456 Oak St",
      panId: "FGHIJ5678K",
      loans: [
        {
          principalAmount: 30000,
          interestRate: 2,
          startDate: subMonths(new Date(), 4), // Started 4 months ago
          duration: 4,
          frequency: PaymentFrequency.WEEKLY,
          status: "ACTIVE",
          installments: [
            {
              principal: 7500,
              interest: 300,
              installmentAmount: 7500,
              amount: 7800,
              dueDate: subDays(new Date(), 112),
              status: PaymentStatus.PAID,
              paidAt: subDays(new Date(), 110),
            },
            {
              principal: 7500,
              interest: 300,
              installmentAmount: 7500,
              amount: 7800,
              dueDate: subDays(new Date(), 84),
              status: PaymentStatus.PAID,
              paidAt: subDays(new Date(), 82),
            },
            {
              principal: 7500,
              interest: 300,
              installmentAmount: 7500,
              amount: 7800,
              dueDate: subDays(new Date(), 56),
              status: PaymentStatus.PAID,
              paidAt: subDays(new Date(), 54),
            },
            {
              principal: 7500,
              interest: 300,
              installmentAmount: 7500,
              amount: 7800,
              dueDate: subDays(new Date(), 28),
              status: PaymentStatus.PAID,
              paidAt: subDays(new Date(), 26),
            },
          ],
        },
      ],
    },
    {
      name: "Bob Johnson",
      fatherName: "Robert Johnson",
      phone: "5555555555",
      address: "789 Pine St",
      panId: "LMNOP9012Q",
      loans: [
        {
          principalAmount: 75000,
          interestRate: 2,
          startDate: subMonths(new Date(), 3), // Started 3 months ago
          duration: 6,
          frequency: PaymentFrequency.MONTHLY,
          status: "ACTIVE",
          installments: [
            {
              principal: 12500,
              interest: 750,
              installmentAmount: 12500,
              amount: 13250,
              dueDate: subDays(new Date(), 90),
              status: PaymentStatus.PAID,
              paidAt: subDays(new Date(), 85),
            },
            {
              principal: 12500,
              interest: 750,
              installmentAmount: 12500,
              amount: 13250,
              dueDate: subDays(new Date(), 60),
              status: PaymentStatus.PAID,
              paidAt: subDays(new Date(), 55),
            },
            {
              principal: 12500,
              interest: 750,
              installmentAmount: 12500,
              amount: 13250,
              dueDate: subDays(new Date(), 30),
              status: PaymentStatus.PAID,
              paidAt: subDays(new Date(), 25),
            },
            {
              principal: 12500,
              interest: 750,
              installmentAmount: 12500,
              amount: 13250,
              dueDate: new Date(),
              status: PaymentStatus.PENDING,
            },
            {
              principal: 12500,
              interest: 750,
              installmentAmount: 12500,
              amount: 13250,
              dueDate: addDays(new Date(), 30),
              status: PaymentStatus.PENDING,
            },
            {
              principal: 12500,
              interest: 750,
              installmentAmount: 12500,
              amount: 13250,
              dueDate: addDays(new Date(), 60),
              status: PaymentStatus.PENDING,
            },
          ],
        },
      ],
    },
  ];

  // Collect all create promises
  const txs: any[] = [];

  // Create borrowers with loans and transactions
  for (const borrowerData of borrowers) {
    txs.push(
      prisma.borrower.create({
        data: {
          name: borrowerData.name,
          fatherName: borrowerData.fatherName,
          phone: borrowerData.phone,
          address: borrowerData.address,
          panId: borrowerData.panId,
          agentId: agentRecord.id,
        },
      })
    );
  }

  // Run borrowers creation and get their IDs
  const createdBorrowers = await prisma.$transaction(txs);
  txs.length = 0;

  // Now create loans, installments, and transactions for each borrower
  for (let i = 0; i < borrowers.length; i++) {
    const borrowerData = borrowers[i];
    const borrower = createdBorrowers[i];
    for (const loanData of borrowerData.loans) {
      txs.push(
        prisma.loan.create({
          data: {
            principalAmount: loanData.principalAmount,
            interestRate: loanData.interestRate,
            startDate: loanData.startDate,
            duration: loanData.duration,
            frequency: loanData.frequency,
            status: loanData.status,
            borrowerId: borrower.id,
          },
        })
      );
    }
  }
  const createdLoans = await prisma.$transaction(txs);
  txs.length = 0;

  // Installments and their transactions
  let loanIdx = 0;
  for (let i = 0; i < borrowers.length; i++) {
    const borrowerData = borrowers[i];
    const borrower = createdBorrowers[i];
    for (const loanData of borrowerData.loans) {
      const loan = createdLoans[loanIdx++];
      for (const installmentData of loanData.installments) {
        txs.push(
          prisma.installment.create({
            data: {
              principal: installmentData.principal,
              interest: installmentData.interest,
              installmentAmount: installmentData.installmentAmount,
              amount: installmentData.amount,
              dueDate: installmentData.dueDate,
              status: installmentData.status,
              paidAt: installmentData.paidAt,
              loanId: loan.id,
            },
          })
        );
      }
      // Loan disbursement transaction
      txs.push(
        prisma.transaction.create({
          data: {
            amount: loanData.principalAmount,
            type: TransactionType.EXPENSE,
            category: TransactionCategory.LOAN,
            notes: `Loan disbursement for ${borrower.name}`,
            createdAt: loanData.startDate,
          },
        })
      );
    }
  }
  const createdInstallmentsAndTxs = await prisma.$transaction(txs);
  txs.length = 0;

  // Sample transactions for testing
  txs.push(
    prisma.transaction.create({
      data: {
        amount: 1200,
        type: TransactionType.EXPENSE,
        category: TransactionCategory.OFFICE,
        notes: "Test Office Supplies",
        createdAt: new Date(),
      },
    }),
    prisma.transaction.create({
      data: {
        amount: 3500,
        type: TransactionType.EXPENSE,
        category: TransactionCategory.CAR,
        notes: "Test Car Repair",
        createdAt: new Date(),
      },
    }),
    prisma.transaction.create({
      data: {
        amount: 8000,
        type: TransactionType.INSTALLMENT,
        category: TransactionCategory.INSTALLMENT,
        notes: "Test Installment Paid",
        createdAt: new Date(),
      },
    }),
    prisma.transaction.create({
      data: {
        amount: 9000,
        type: TransactionType.INSTALLMENT,
        category: TransactionCategory.INSTALLMENT,
        notes: "Test Installment Pending",
        createdAt: new Date(),
      },
    }),
    prisma.transaction.create({
      data: {
        amount: 5000,
        type: TransactionType.OTHER,
        category: TransactionCategory.OTHER,
        notes: "Test Misc Income",
        createdAt: new Date(),
      },
    })
  );

  // === STANDALONE SAMPLE TRANSACTIONS OVER LAST 6 MONTHS ===
  const today = new Date();
  for (let i = 0; i < 6; i++) {
    // 1st of each month (going back)
    const expenseDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const incomeDate = new Date(today.getFullYear(), today.getMonth() - i, 15);
    txs.push(
      prisma.transaction.create({
        data: {
          amount: 1000 * (i + 1),
          type: TransactionType.EXPENSE,
          category: TransactionCategory.PERSONAL,
          notes: `Standalone Expense for ${expenseDate.toLocaleString(
            "default",
            { month: "long", year: "numeric" }
          )}`,
          createdAt: expenseDate,
        },
      })
    );
    txs.push(
      prisma.transaction.create({
        data: {
          amount: 2000 * (i + 1),
          type: TransactionType.OTHER,
          category: TransactionCategory.OTHER,
          notes: `Standalone Income for ${incomeDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}`,
          createdAt: incomeDate,
        },
      })
    );
  }

  // Run all remaining creations in a single transaction
  await prisma.$transaction(txs);

  console.log("Database has been seeded. 🌱");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
