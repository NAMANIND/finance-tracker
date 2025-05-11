"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { TransactionType } from "@prisma/client";
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

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
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900">
                Today&apos;s Installments
              </h2>
              <div className="mt-4">
                {todayInstallments.length === 0 ? (
                  <p className="text-gray-500">No installments due today.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Borrower
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {todayInstallments.map((installment) => (
                          <tr key={installment.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {installment.borrowerName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ₹{installment.amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  installment.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {installment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Today's Transactions */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900">
                Today&apos;s Transactions
              </h2>
              <div className="mt-4">
                {todayTransactions.length === 0 ? (
                  <p className="text-gray-500">
                    No transactions recorded today
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Borrower
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {todayTransactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {transaction.borrowerName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ₹{transaction.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Today's New Borrowers */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900">
                Today&apos;s New Borrowers
              </h2>
              <div className="mt-4">
                {todayBorrowers.length === 0 ? (
                  <p className="text-gray-500">
                    No new borrowers registered today
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phone
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            PAN ID
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {todayBorrowers.map((borrower) => (
                          <tr key={borrower.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {borrower.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {borrower.phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {borrower.panId}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900">
                Additional Stats
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Upcoming Dues
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {stats.upcomingDues}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Defaulters
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {stats.defaulters}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Form */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900">
            Add New Transaction
          </h2>

          {/* Transaction Mode Selection */}
          <div className="flex space-x-4 mb-6">
            <button
              type="button"
              onClick={() => handleModeChange("expense")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                transactionMode === "expense"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Add Expense
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("borrower")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                transactionMode === "borrower"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Borrower Payment
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Category Selection - Only show for expense mode */}
              {transactionMode === "expense" && (
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="HOME">Home</option>
                    <option value="CAR">Car</option>
                    <option value="SHOP">Shop</option>
                    <option value="OFFICE">Office</option>
                    <option value="FAMILY">Family</option>
                    <option value="PERSONAL">Personal</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              )}

              {/* Borrower Section - Only show if in borrower mode */}
              {transactionMode === "borrower" && (
                <div className="space-y-4 sm:col-span-2">
                  <div>
                    <label
                      htmlFor="borrowerSearch"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Search Borrower
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="text"
                        id="borrowerSearch"
                        value={borrowerSearch}
                        onChange={(e) => setBorrowerSearch(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Search by name, phone, or PAN ID"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="borrowerSelect"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Select Borrower
                    </label>
                    <select
                      id="borrowerSelect"
                      value={
                        formData.loanId
                          ? loans.find((l) => l.id === formData.loanId)
                              ?.borrowerId || ""
                          : ""
                      }
                      onChange={(e) => {
                        const borrowerId = e.target.value;
                        if (borrowerId) {
                          setFormData((prev) => ({
                            ...prev,
                            borrowerId: borrowerId,
                          }));
                          handleBorrowerChange(borrowerId);
                        } else {
                          setSelectedBorrowerInstallments([]);
                          setFormData((prev) => ({
                            ...prev,
                            loanId: "",
                            installmentId: "",
                          }));
                        }
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required={transactionMode === "borrower"}
                    >
                      <option value="">Select a borrower</option>
                      {filteredBorrowers.map((borrower) => (
                        <option key={borrower.id} value={borrower.id}>
                          {borrower.name} - {borrower.phone} - {borrower.panId}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedBorrowerInstallments.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pending Installments
                      </label>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {selectedBorrowerInstallments.map((installment) => (
                          <button
                            key={installment.id}
                            type="button"
                            onClick={() => handleInstallmentSelect(installment)}
                            className={`p-3 text-left rounded-lg border ${
                              formData.installmentId === installment.id
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-gray-200 hover:border-indigo-300"
                            }`}
                          >
                            <div className="font-medium">
                              ₹{installment?.amount?.toLocaleString() || "0"}
                            </div>
                            <div className="text-sm text-gray-500">
                              Due:{" "}
                              {new Date(
                                installment.dueDate
                              ).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              Principal: ₹
                              {installment.principal.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              Interest: ₹{installment.interest.toLocaleString()}
                            </div>
                            <div
                              className={`mt-1 text-xs font-medium ${
                                installment.status === "OVERDUE"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {installment.status}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Transaction Type - Only show if in borrower mode */}
              {transactionMode === "borrower" && (
                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Transaction Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INSTALLMENT">Installment</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              )}

              {/* Penalty Reason - Only show if penalty type is selected */}
              {transactionMode === "borrower" &&
                formData.type === "INSTALLMENT" && (
                  <div>
                    <label
                      htmlFor="penaltyReason"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Penalty Reason
                    </label>
                    <input
                      type="text"
                      id="penaltyReason"
                      name="penaltyReason"
                      value={formData.penaltyReason}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Enter reason for penalty"
                      required
                    />
                  </div>
                )}

              {/* Amount Input */}
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700"
                >
                  Amount
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700"
                >
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Add any additional notes about this transaction"
                />
              </div>
            </div>

            {formError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{formError}</div>
              </div>
            )}

            {formSuccess && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-700">{formSuccess}</div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Add Transaction
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
