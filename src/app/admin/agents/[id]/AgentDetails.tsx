import { Agent, User, Borrower, Loan } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

export default function AgentDetails({ agent }: AgentDetailsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Name</h3>
          <p className="mt-1">{agent.user.name}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Email</h3>
          <p className="mt-1">{agent.user.email}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Phone</h3>
          <p className="mt-1">{agent.user.phone}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Address</h3>
          <p className="mt-1">{agent.user.address}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Status</h3>
          <div className="mt-1">
            <Badge variant={agent.isActive ? "success" : "destructive"}>
              {agent.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Commission Rate</h3>
          <p className="mt-1">{agent.commissionRate}%</p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-500">Statistics</h3>
        <div className="mt-2 grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{agent.borrowers.length}</div>
              <div className="text-sm text-gray-500">Total Borrowers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {agent.borrowers.reduce(
                  (acc: number, borrower) => acc + borrower.loans.length,
                  0
                )}
              </div>
              <div className="text-sm text-gray-500">Active Loans</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                ₹
                {agent.borrowers
                  .reduce(
                    (acc: number, borrower) =>
                      acc +
                      borrower.loans.reduce(
                        (loanAcc: number, loan) =>
                          loanAcc + loan.principalAmount,
                        0
                      ),
                    0
                  )
                  .toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Loan Amount</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
