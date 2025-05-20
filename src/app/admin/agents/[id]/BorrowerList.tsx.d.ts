import { Borrower, Loan } from "@prisma/client";

export type BorrowerWithLoans = Borrower & {
  loans: (Loan & {
    principalAmount: number;
  })[];
  isActive: boolean;
};

interface BorrowerListProps {
  agentId: string;
}

declare const BorrowerList: React.FC<BorrowerListProps>;
export default BorrowerList;
