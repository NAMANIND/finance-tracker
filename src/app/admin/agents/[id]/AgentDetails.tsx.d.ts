import { Agent, User, Borrower, Loan } from "@prisma/client";

type AgentWithDetails = Agent & {
  user: User;
  isActive: boolean;
  commissionRate: number;
  borrowers: (Borrower & {
    loans: (Loan & {
      principalAmount: number;
    })[];
  })[];
};

interface AgentDetailsProps {
  agent: AgentWithDetails;
}

declare const AgentDetails: React.FC<AgentDetailsProps>;
export default AgentDetails;
