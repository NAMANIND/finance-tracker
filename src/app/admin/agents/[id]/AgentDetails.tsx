import { Agent, User, Borrower, Loan } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  HomeIcon,
  IdentificationIcon,
  CreditCardIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

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
    <div className="space-y-8">
      {/* Personal Information */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <UserIcon className="h-6 w-6 text-indigo-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            Personal Information
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="flex items-start space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
              <UserIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {agent.user.name}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <EnvelopeIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {agent.user.email}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
              <PhoneIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {agent.user.phone}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50">
              <HomeIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Address</p>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {agent.user.address}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-50">
              <IdentificationIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">ID Proof</p>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {agent.user.idProof}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-50">
              <CreditCardIcon className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Commission Rate
              </p>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {agent.commissionRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <ChartBarIcon className="h-6 w-6 text-indigo-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            Performance Metrics
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card className="overflow-hidden transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
                  <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Borrowers
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {agent.borrowers.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                  <CreditCardIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Active Loans
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {agent.borrowers.reduce(
                      (acc: number, borrower) => acc + borrower.loans.length,
                      0
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                  <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Loan Amount
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
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
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
