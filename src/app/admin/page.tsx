"use client";

import { useEffect, useState } from "react";
import { format, formatDate } from "date-fns";
import { TransactionType } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
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

interface NewTransactionForm {
  loanId: string;
  installmentId?: string;
  amount: number;
  type: TransactionType;
  category:
    | "HOME"
    | "CAR"
    | "SHOP"
    | "OFFICE"
    | "FAMILY"
    | "PERSONAL"
    | "OTHER";
  notes: string;
  penaltyReason?: string;
  borrowerId?: string;
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
  const [stats, setStats] = useState<DashboardStats>({
    totalLoans: 0,
    totalBorrowers: 0,
    totalAgents: 0,
    totalProfit: 0,
    upcomingDues: 0,
    defaulters: 0,
  });
  const [todayTransactions, setTodayTransactions] = useState<Transaction[]>([]);
  const [todayBorrowers, setTodayBorrowers] = useState<Borrower[]>([]);
  const [todayInstallments, setTodayInstallments] = useState<Installment[]>([]);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBorrowerInstallments, setSelectedBorrowerInstallments] =
    useState<Installment[]>([]);
  const [borrowerSearch, setBorrowerSearch] = useState("");
  const [filteredBorrowers, setFilteredBorrowers] = useState<Borrower[]>([]);
  const [transactionMode, setTransactionMode] = useState<
    "expense" | "borrower"
  >("expense");
  const [formData, setFormData] = useState<NewTransactionForm>({
    loanId: "",
    installmentId: "",
    amount: 0,
    type: TransactionType.EXPENSE,
    category: "PERSONAL",
    notes: "",
    penaltyReason: "",
    borrowerId: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch dashboard stats
        const statsRes = await fetch("/api/admin/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!statsRes.ok) {
          throw new Error("Failed to fetch stats");
        }

        const statsData = await statsRes.json();
        setStats(statsData);

        // Fetch today's transactions
        const transactionsRes = await fetch("/api/admin/transactions/today", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!transactionsRes.ok) {
          throw new Error("Failed to fetch transactions");
        }

        const transactionsData = await transactionsRes.json();
        setTodayTransactions(transactionsData);

        // Fetch today's borrowers
        const borrowersRes = await fetch("/api/admin/borrowers/today", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!borrowersRes.ok) {
          throw new Error("Failed to fetch borrowers");
        }

        const borrowersData = await borrowersRes.json();
        console.log("Today's borrowers:", borrowersData);
        setTodayBorrowers(borrowersData);

        // Fetch today's installments
        const installmentsRes = await fetch("/api/admin/installments/today", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!installmentsRes.ok) {
          throw new Error("Failed to fetch installments");
        }

        const installmentsData = await installmentsRes.json();
        console.log("Today's installments:", installmentsData);
        setTodayInstallments(installmentsData);

        // Fetch all borrowers for the form
        const allBorrowersRes = await fetch("/api/admin/borrowers", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!allBorrowersRes.ok) {
          throw new Error("Failed to fetch all borrowers");
        }

        const allBorrowersData = await allBorrowersRes.json();
        setBorrowers(allBorrowersData);

        // Fetch all loans for the form
        const loansRes = await fetch("/api/admin/loans", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!loansRes.ok) {
          throw new Error("Failed to fetch loans");
        }

        const loansData = await loansRes.json();
        setLoans(loansData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter borrowers based on search
  useEffect(() => {
    if (borrowerSearch.trim() === "") {
      setFilteredBorrowers(borrowers);
    } else {
      const searchLower = borrowerSearch.toLowerCase();
      const filtered = borrowers.filter(
        (borrower) =>
          borrower.name.toLowerCase().includes(searchLower) ||
          borrower.phone.includes(searchLower) ||
          borrower.panId.toLowerCase().includes(searchLower)
      );
      setFilteredBorrowers(filtered);
    }
  }, [borrowerSearch, borrowers]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "amount" ? parseFloat(value) : value,
    });
  };

  const handleModeChange = (mode: "expense" | "borrower") => {
    setTransactionMode(mode);
    if (mode === "expense") {
      setFormData((prev) => ({
        ...prev,
        type: "OTHER",
        loanId: "",
        installmentId: "",
        penaltyReason: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        type: TransactionType.INSTALLMENT,
        penaltyReason: "",
      }));
    }
  };

  const handleBorrowerChange = async (borrowerId: string) => {
    // Reset loan and installment when borrower changes
    setFormData((prev) => ({
      ...prev,
      loanId: "",
      installmentId: "",
    }));

    if (!borrowerId) {
      setSelectedBorrowerInstallments([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Fetch installments for the selected borrower
      const installmentsRes = await fetch(
        `/api/admin/borrowers/${borrowerId}/installments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!installmentsRes.ok) {
        throw new Error("Failed to fetch installments");
      }

      const installmentsData = await installmentsRes.json();
      setSelectedBorrowerInstallments(installmentsData);

      // Fetch loans for the selected borrower
      const loansRes = await fetch(`/api/admin/borrowers/${borrowerId}/loans`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!loansRes.ok) {
        throw new Error("Failed to fetch loans");
      }

      const loansData = await loansRes.json();

      // Update the loans state with only the loans for this borrower
      setLoans(loansData);
    } catch (error) {
      console.error("Error fetching borrower data:", error);
    }
  };

  const handleInstallmentSelect = (installment: Installment) => {
    setFormData((prev) => ({
      ...prev,
      loanId: installment.loanId,
      installmentId: installment.id,
      amount: installment.amount,
      type: TransactionType.INSTALLMENT,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add transaction");
      }

      // Reset form
      setFormData({
        loanId: "",
        installmentId: "",
        amount: 0,
        type: TransactionType.EXPENSE,
        category: "PERSONAL",
        notes: "",
        penaltyReason: "",
      });

      setFormSuccess("Transaction added successfully!");

      // Refresh transactions
      const transactionsRes = await fetch("/api/admin/transactions/today", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!transactionsRes.ok) {
        throw new Error("Failed to refresh transactions");
      }

      const transactionsData = await transactionsRes.json();
      setTodayTransactions(transactionsData);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to add transaction"
      );
    }
  };

  if (loading) {
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
                        {todayInstallments.map((installment) => (
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
                        {todayTransactions.map((transaction) => (
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
                                  {transaction.borrowerName || transaction.type}
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
                        {todayBorrowers.map((borrower) => (
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
                      (installment) => installment.status === "OVERDUE"
                    ).length === 0 ? (
                      <p className="text-gray-500">No defaulters found.</p>
                    ) : (
                      <div className="space-y-4">
                        {todayInstallments
                          .filter(
                            (installment) => installment.status === "OVERDUE"
                          )
                          .map((installment) => (
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
