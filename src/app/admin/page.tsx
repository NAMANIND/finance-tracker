"use client";

import { formatDate } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  Wallet,
  AlertCircle,
  Clock,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface DashboardStats {
  totalLoans: number;
  totalBorrowers: number;
  totalAgents: number;
  totalProfit: number;
  upcomingDues: number;
  defaulters: number;
}

interface Transaction {
  id: string;
  loanId: string;
  borrowerName: string;
  amount: number;
  type: string;
  category: string;
  createdAt: string;
}

interface Borrower {
  id: string;
  name: string;
  fatherName: string;
  phone: string;
  address: string;
  panId: string;
  createdAt: string;
}

interface Installment {
  id: string;
  loanId: string;
  amount: number;
  principal: number;
  interest: number;
  installmentAmount: number;
  dueDate: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  borrowerName?: string;
  borrowerPhone?: string;
  borrowerId: string;
}

export default function AdminDashboard() {
  const router = useRouter();

  // React Query hook for fetching dashboard stats
  const {
    data: stats = {
      totalLoans: 0,
      totalBorrowers: 0,
      totalAgents: 0,
      totalProfit: 0,
      upcomingDues: 0,
      defaulters: 0,
    },
    isLoading: isLoadingStats,
  } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        toast.error("Failed to fetch stats");
        throw new Error("Failed to fetch stats");
      }
      return response.json();
    },
  });

  // React Query hook for fetching today's transactions
  const { data: todayTransactions = [], isLoading: isLoadingTransactions } =
    useQuery({
      queryKey: ["todayTransactions"],
      queryFn: async () => {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/admin/transactions/today", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          toast.error("Failed to fetch transactions");
          throw new Error("Failed to fetch transactions");
        }
        return response.json();
      },
    });

  // React Query hook for fetching today's installments
  const { data: todayInstallments = [], isLoading: isLoadingInstallments } =
    useQuery({
      queryKey: ["todayInstallments"],
      queryFn: async () => {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/admin/installments/today", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          toast.error("Failed to fetch installments");
          throw new Error("Failed to fetch installments");
        }
        return response.json();
      },
    });

  // React Query hook for fetching today's borrowers
  const { data: todayBorrowers = [], isLoading: isLoadingBorrowers } = useQuery(
    {
      queryKey: ["todayBorrowers"],
      queryFn: async () => {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/admin/borrowers/today", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          toast.error("Failed to fetch borrowers");
          throw new Error("Failed to fetch borrowers");
        }
        return response.json();
      },
    }
  );

  const isLoading =
    isLoadingStats ||
    isLoadingTransactions ||
    isLoadingInstallments ||
    isLoadingBorrowers;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <Button
          onClick={() => router.push("/admin/transactions")}
          className="flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 gap-2"
        >
          <PlusCircle className="h-5 w-5" />
          <span>Add Transaction</span>
        </Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Loans */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Total Active Loans
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {stats.totalLoans}
          </dd>
        </div>

        {/* Total Borrowers */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Total Borrowers
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {stats.totalBorrowers}
          </dd>
        </div>

        {/* Total Agents */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Total Agents
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {stats.totalAgents}
          </dd>
        </div>

        {/* Total Profit */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Total Profit
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            ₹{stats.totalProfit.toLocaleString()}
          </dd>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Today's Installments */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium text-gray-900">
                      Today&apos;s Installments
                    </h2>
                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                      {todayInstallments.length}
                    </span>
                  </div>
                  <ChevronDown className="h-5 w-5 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-6 pt-0">
                  <div className="min-h-[400px] max-h-[400px] overflow-y-auto">
                    {todayInstallments.length === 0 ? (
                      <p className="text-gray-500">
                        No installments due today.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {todayInstallments.map((installment: Installment) => (
                          <div
                            key={installment.id}
                            className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                          >
                            <div className="flex items-center space-x-4">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                  installment.status === "PAID"
                                    ? "bg-green-100"
                                    : installment.status === "OVERDUE"
                                    ? "bg-red-100"
                                    : "bg-yellow-100"
                                }`}
                              >
                                {installment.status === "PAID" ? (
                                  <Wallet className="h-5 w-5 text-green-600" />
                                ) : installment.status === "OVERDUE" ? (
                                  <AlertCircle className="h-5 w-5 text-red-600" />
                                ) : (
                                  <Clock className="h-5 w-5 text-yellow-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {installment.borrowerName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatDate(
                                    installment.dueDate,
                                    "dd MMM yyyy"
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-medium ${
                                  installment.status === "PAID"
                                    ? "text-green-600"
                                    : installment.status === "OVERDUE"
                                    ? "text-red-600"
                                    : "text-yellow-600"
                                }`}
                              >
                                {formatCurrency(installment.amount)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {installment.status}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Today's Transactions */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium text-gray-900">
                      Today&apos;s Transactions
                    </h2>
                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                      {todayTransactions.length}
                    </span>
                  </div>
                  <ChevronDown className="h-5 w-5 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-6 pt-0">
                  <div className="min-h-[400px] max-h-[400px] overflow-y-auto">
                    {todayTransactions.length === 0 ? (
                      <p className="text-gray-500">
                        No transactions recorded today
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        {todayTransactions.map((transaction: Transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between rounded-lg border border-gray-200 p-4 mb-4"
                          >
                            <div className="flex items-center space-x-4">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                  transaction.type === "EXPENSE"
                                    ? "bg-red-100"
                                    : transaction.type === "INSTALLMENT"
                                    ? "bg-green-100"
                                    : "bg-green-100"
                                }`}
                              >
                                {transaction.type === "EXPENSE" ? (
                                  <ArrowDownRight className="h-5 w-5 text-red-600" />
                                ) : transaction.type === "INSTALLMENT" ? (
                                  <Wallet className="h-5 w-5 text-green-600" />
                                ) : (
                                  <ArrowUpRight className="h-5 w-5 text-green-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {transaction.category}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatDate(
                                    transaction.createdAt,
                                    "dd MMM yyyy"
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-medium ${
                                  transaction.type === "EXPENSE"
                                    ? "text-red-600"
                                    : transaction.type === "INSTALLMENT"
                                    ? "text-green-600"
                                    : "text-green-600"
                                }`}
                              >
                                {transaction.type === "EXPENSE" ? "-" : "+"}
                                {formatCurrency(transaction.amount)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {transaction.type}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Today's New Borrowers */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium text-gray-900">
                      Today&apos;s New Borrowers
                    </h2>
                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                      {todayBorrowers.length}
                    </span>
                  </div>
                  <ChevronDown className="h-5 w-5 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-6 pt-0">
                  <div className="min-h-[400px] max-h-[400px] overflow-y-auto">
                    {todayBorrowers.length === 0 ? (
                      <p className="text-gray-500">
                        No new borrowers registered today
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {todayBorrowers.map((borrower: Borrower) => (
                          <div
                            key={borrower.id}
                            className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                <UserPlus className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {borrower.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {borrower.phone}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-blue-600">
                                New Borrower
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(borrower.createdAt, "dd MMM yyyy")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Additional Stats */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium text-gray-900">
                      Defaulters
                    </h2>
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      {stats.defaulters}
                    </span>
                  </div>
                  <ChevronDown className="h-5 w-5 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-6 pt-0">
                  <div className="min-h-[400px] max-h-[400px] overflow-y-auto">
                    {todayInstallments.filter(
                      (installment: Installment) =>
                        installment.status === "OVERDUE"
                    ).length === 0 ? (
                      <p className="text-gray-500">No defaulters found.</p>
                    ) : (
                      <div className="space-y-4">
                        {todayInstallments
                          .filter(
                            (installment: Installment) =>
                              installment.status === "OVERDUE"
                          )
                          .map((installment: Installment) => (
                            <div
                              key={installment.id}
                              className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-4"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {installment.borrowerName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Due:{" "}
                                  {new Date(
                                    installment.dueDate
                                  ).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Amount: ₹{installment.amount.toLocaleString()}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/admin/borrowers/${installment.borrowerId}`
                                  )
                                }
                              >
                                View Details
                              </Button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
}
