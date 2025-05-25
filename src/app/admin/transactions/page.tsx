"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { TransactionType, Loan, TransactionCategory } from "@prisma/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { TransactionsSkeleton } from "@/components/dashboard/TransactionsSkeleton";

interface Transaction {
  id: string;
  loanId: string;
  borrowerName: string;
  amount: number;
  type: string;
  category: string;
  notes: string;
  createdAt: string;
}

interface Borrower {
  id: string;
  name: string;
  guarantorName: string;
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
}

interface NewTransactionForm {
  loanId: string;
  installmentId?: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  notes: string;
  penaltyAmount?: number;
  extraAmount?: number;
  borrowerId?: string;
  name?: string;
  dueAmount?: number;
  installmentAmount?: string;
  interest?: number;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBorrowerInstallments, setSelectedBorrowerInstallments] =
    useState<Installment[]>([]);
  const [borrowerSearch, setBorrowerSearch] = useState("");
  const [filteredBorrowers, setFilteredBorrowers] = useState<Borrower[]>([]);
  const [formData, setFormData] = useState<NewTransactionForm>({
    loanId: "",
    installmentId: "",
    amount: 0,
    type: TransactionType.EXPENSE,
    category: "PERSONAL",
    notes: "",
    penaltyAmount: 0,
    extraAmount: 0,
    borrowerId: "",
    name: "ADMIN",
    dueAmount: 0,
    installmentAmount: "",
    interest: 0,
  });
  const [formError, setFormError] = useState("");
  const [activeTab, setActiveTab] = useState("expense");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch today's transactions
        const transactionsRes = await fetch("/api/admin/transactions/today", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!transactionsRes.ok) {
          toast.error("Failed to fetch transactions");
          throw new Error("Failed to fetch transactions");
        }

        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData);

        // Fetch all borrowers for the form
        const borrowersRes = await fetch("/api/admin/borrowers", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!borrowersRes.ok) {
          toast.error("Failed to fetch borrowers");
          throw new Error("Failed to fetch borrowers");
        }

        const borrowersData = await borrowersRes.json();
        setBorrowers(borrowersData);
        setFilteredBorrowers(borrowersData);
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: value,
      };

      // Calculate due amount only when amount changes
      if (prev.type === TransactionType.INSTALLMENT && name === "amount") {
        const installmentAmount = Number(prev.installmentAmount);
        const enteredAmount = Number(value);
        // If entered amount exceeds installment amount, cap it at installment amount
        const finalAmount = Math.min(enteredAmount, installmentAmount);
        newData.amount = finalAmount;
        newData.dueAmount = installmentAmount - finalAmount;
      }

      return newData;
    });
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

    // Find the selected borrower to get their name
    const selectedBorrower = borrowers.find((b) => b.id === borrowerId);
    if (selectedBorrower) {
      setFormData((prev) => ({
        ...prev,
        name: selectedBorrower.name,
      }));
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
      installmentAmount: installment.amount.toString(),
      interest: installment.interest,
      dueAmount: 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.type) {
      setFormError("Transaction type is required");
      return;
    }

    if (!formData.category && formData.type !== TransactionType.INSTALLMENT) {
      setFormError("Category is required for non-installment transactions");
      return;
    }

    // it is borrower payment
    if (formData.type === TransactionType.INSTALLMENT) {
      if (!formData.borrowerId) {
        setFormError("Borrower selection is required");
        return;
      }
    }

    if (!formData.amount || formData.amount <= 0) {
      setFormError("Amount must be greater than 0");
      return;
    }

    if (formData.type === TransactionType.INSTALLMENT) {
      if (!formData.loanId) {
        setFormError("Loan ID is required for installment payments");
        return;
      }
      if (!formData.installmentId) {
        setFormError("Installment ID is required for installment payments");
        return;
      }
    }

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
        category:
          activeTab === "borrower"
            ? TransactionCategory.INSTALLMENT
            : "PERSONAL",
        notes: "",
        penaltyAmount: 0,
        extraAmount: 0,
        name: "ADMIN",
        dueAmount: 0,
        installmentAmount: "",
        interest: 0,
      });

      setSelectedBorrowerInstallments([]);

      toast.success("Transaction added successfully!");

      // Refresh transactions
      const transactionsRes = await fetch("/api/admin/transactions/today", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!transactionsRes.ok) {
        toast.error("Failed to refresh transactions");
        throw new Error("Failed to refresh transactions");
      }

      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add transaction";
      setFormError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy hh:mm a");
  };

  if (loading) {
    return <TransactionsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and view all recent transactions in the system
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Transactions */}
        <Card className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-lg font-medium text-gray-900">
              Today&apos;s Transactions
            </h2>
            <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
              {transactions.length}
            </span>
          </div>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-gray-500">No transactions recorded today</p>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        transaction.type === "EXPENSE"
                          ? "bg-red-100"
                          : "bg-green-100"
                      }`}
                    >
                      {transaction.type === "EXPENSE" ? (
                        <ArrowDownRight className="h-5 w-5 text-red-600" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.category} - {transaction.borrowerName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-medium ${
                        transaction.type === "EXPENSE"
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {transaction.type === "EXPENSE" ? "-" : "+"}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-500">{transaction.type}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Add Transaction Form */}
        <Card className="p-6 h-fit">
          <h2 className="mb-6 text-lg font-medium text-gray-900">
            Add New Transaction
          </h2>
          <Tabs defaultValue="expense" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger
                onClick={() => {
                  setActiveTab("expense");
                  setFormData((prev) => ({
                    ...prev,
                    type: TransactionType.EXPENSE,
                    category: "PERSONAL",
                    amount: 0,
                    notes: "",
                    name: "ADMIN",
                  }));

                  setFormError("");
                }}
                value="expense"
              >
                Add Transaction
              </TabsTrigger>
              <TabsTrigger
                onClick={() => {
                  setActiveTab("borrower");
                  setFormData((prev) => ({
                    ...prev,
                    type: TransactionType.INSTALLMENT,
                    category: TransactionCategory.INSTALLMENT,
                    amount: 0,
                    notes: "",
                  }));
                  // clear the error
                  setFormError("");
                }}
                value="borrower"
              >
                Borrower Payment
              </TabsTrigger>
            </TabsList>
            <TabsContent value="expense">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Transaction Type
                  </label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: TransactionType) => {
                      setFormData((prev) => ({ ...prev, type: value }));
                      if (value === "INCOME") {
                        setFormData((prev) => ({
                          ...prev,
                          category: "OFFICE",
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXPENSE">Expense</SelectItem>
                      <SelectItem value="INCOME">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Category
                  </label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: TransactionCategory) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: value as TransactionCategory,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOME">Home</SelectItem>
                      <SelectItem value="CAR">Car</SelectItem>

                      <SelectItem value="OFFICE">Office</SelectItem>

                      <SelectItem value="PERSONAL">Personal</SelectItem>
                      <SelectItem value="EMI">EMI</SelectItem>
                      <SelectItem value="INTEREST">Interest</SelectItem>
                      <SelectItem value="FARM">Farm</SelectItem>
                      <SelectItem value="BHOPAL">Bhopal</SelectItem>
                      <SelectItem value="SAI_BABA">Sai Baba</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Amount
                  </label>
                  <Input
                    type="number"
                    id="amount"
                    name="amount"
                    placeholder="Enter amount"
                    value={formData.amount === 0 ? "" : formData.amount}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Notes
                  </label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Add any additional notes about this transaction"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  Add Transaction
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="borrower">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="borrowerSearch"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Search Borrower
                  </label>
                  <Input
                    type="text"
                    id="borrowerSearch"
                    value={borrowerSearch}
                    onChange={(e) => setBorrowerSearch(e.target.value)}
                    placeholder="Search by name, phone, or PAN ID"
                  />
                </div>

                <div>
                  <label
                    htmlFor="borrowerSelect"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Select Borrower
                  </label>
                  <Select
                    value={
                      formData.loanId
                        ? loans.find((l) => l.id === formData.loanId)
                            ?.borrowerId || ""
                        : ""
                    }
                    onValueChange={(value) => {
                      if (value) {
                        setFormData((prev) => ({
                          ...prev,
                          borrowerId: value,
                        }));
                        handleBorrowerChange(value);
                      } else {
                        setSelectedBorrowerInstallments([]);
                        setFormData((prev) => ({
                          ...prev,
                          loanId: "",
                          installmentId: "",
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a borrower" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredBorrowers.map((borrower) => (
                        <SelectItem key={borrower.id} value={borrower.id}>
                          {borrower.name} - {borrower.phone} - {borrower.panId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedBorrowerInstallments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pending Installments
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
                      {selectedBorrowerInstallments.map((installment) => (
                        <button
                          key={installment.id}
                          type="button"
                          onClick={() => handleInstallmentSelect(installment)}
                          className={`p-2.5 text-left rounded-lg border transition-all duration-200 ${
                            formData.installmentId === installment.id
                              ? "border-indigo-500 bg-indigo-50 shadow-sm"
                              : "border-gray-200 hover:border-indigo-300 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-medium text-base">
                              ₹{installment?.amount?.toLocaleString() || "0"}
                            </div>
                            <div
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                installment.status === "OVERDUE"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {installment.status}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                            <div>
                              <span className="text-gray-500">Due:</span>{" "}
                              {new Date(
                                installment.dueDate
                              ).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="text-gray-500">Principal:</span>{" "}
                              ₹{installment.principal.toLocaleString()}
                            </div>
                            <div>
                              <span className="text-gray-500">Interest:</span> ₹
                              {installment.interest.toLocaleString()}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Amount
                  </label>
                  <Input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount === 0 ? "" : formData.amount}
                    placeholder="Enter Payment Amount"
                    onChange={handleInputChange}
                    required
                    min="0"
                    max={formData.installmentAmount}
                    step="0.01"
                  />
                  {formData.installmentId && (
                    <p className="mt-1 text-sm text-gray-500">
                      Due Amount: ₹{Number(formData.dueAmount).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label
                      htmlFor="penaltyAmount"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Penalty Amount
                    </label>
                    <Input
                      type="number"
                      id="penaltyAmount"
                      name="penaltyAmount"
                      value={
                        formData.penaltyAmount === 0
                          ? ""
                          : formData.penaltyAmount
                      }
                      onChange={handleInputChange}
                      placeholder="Enter Penalty Amount"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="w-1/2">
                    <label
                      htmlFor="extraAmount"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Extra Amount
                    </label>
                    <Input
                      type="number"
                      id="extraAmount"
                      name="extraAmount"
                      value={
                        formData.extraAmount === 0 ? "" : formData.extraAmount
                      }
                      onChange={handleInputChange}
                      placeholder="Enter Extra Amount"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Base Amount:</span>
                      <span className="font-medium">
                        ₹{Number(formData.amount).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Extra Amount:</span>
                      <span className="font-medium">
                        ₹{Number(formData.extraAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Due Amount:</span>
                      <span className="font-medium">
                        ₹{Number(formData.dueAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between font-medium">
                        <span className="text-gray-900">Total Amount:</span>
                        <span className="text-indigo-600">
                          ₹
                          {(
                            Number(formData.amount || 0) +
                            Number(formData.extraAmount || 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Notes
                  </label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Add any additional notes about this transaction"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  Add Payment
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {formError && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{formError}</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
