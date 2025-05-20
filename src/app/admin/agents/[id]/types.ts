import { Agent, User, Borrower, Loan } from "@prisma/client";

export type AgentWithDetails = Agent & {
  user: User & {
    idProof: string;
    address: string;
  };
  isActive: boolean;
  commissionRate: number;
  borrowers: (Borrower & {
    loans: (Loan & {
      principalAmount: number;
    })[];
  })[];
};

export type BorrowerWithLoans = Borrower & {
  loans: (Loan & {
    principalAmount: number;
  })[];
  isActive: boolean;
};
