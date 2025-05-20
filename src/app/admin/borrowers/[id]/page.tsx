"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import {
  UserIcon,
  CreditCardIcon,
  PlusCircleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Loan {
  id: string;
  principalAmount: number;
  interestRate: number;
  status: string;
  startDate: string;
  installments: {
    id: string;
    dueDate: string;
    amount: number;
    status: string;
    principal: number;
    interest: number;
    installmentAmount: number;
  }[];
}

interface Borrower {
  id: string;
  name: string;
  fatherName: string;
  phone: string;
  address: string;
  panId: string;
  agent: {
    user: {
      name: string;
    };
  };
  loans: Loan[];
}

interface InstallmentDetails {
  totalAmount: number;
  totalInterest: number;
  actualAmountReceived: number;
  amountGiven: number;
  installments: {
    dueDate: string;
    amount: number;
    principal: number;
    interest: number;
    installmentAmount: number;
  }[];
}

export default function BorrowerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [borrower, setBorrower] = useState<Borrower | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("loans");
  const [expandedLoans, setExpandedLoans] = useState<Record<string, boolean>>(
    {}
  );
  const [formData, setFormData] = useState({
    principalAmount: "",
    interestRate: "",
    repaymentFrequency: "WEEKLY",
    startDate: new Date().toISOString().split("T")[0],
    loanDurationMonths: "4",
  });
  const [formError, setFormError] = useState("");
  const [installmentDetails, setInstallmentDetails] =
    useState<InstallmentDetails | null>(null);

  useEffect(() => {
    const fetchBorrowerDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/admin/borrowers/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch borrower details");
        }

        const data = await res.json();
        setBorrower(data);

        // Set the first loan to be expanded by default
        if (data.loans && data.loans.length > 0) {
          setExpandedLoans({ [data.loans[0].id]: true });
        }
      } catch (error) {
        console.error("Error fetching borrower details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBorrowerDetails();
  }, [id]);

  const calculateInstallments = useCallback(() => {
    const principal = parseFloat(formData.principalAmount);
    const interestRate = parseFloat(formData.interestRate);
    const durationMonths = parseInt(formData.loanDurationMonths);
    const startDate = new Date(formData.startDate);

    if (
      isNaN(principal) ||
      isNaN(interestRate) ||
      isNaN(durationMonths) ||
      !startDate
    ) {
      setInstallmentDetails(null);
      return;
    }

    // Calculate number of installments based on frequency
    const isWeekly = formData.repaymentFrequency === "WEEKLY";
    const isDaily = formData.repaymentFrequency === "DAILY";
    const numberOfInstallments = isDaily
      ? durationMonths * 30 // 30 days per month for daily
      : isWeekly
      ? durationMonths * 4 // 4 weeks per month for weekly
      : durationMonths; // monthly

    // Calculate monthly interest rate
    const monthlyInterestRate = interestRate / 100;

    // Calculate total interest
    const totalInterest = principal * monthlyInterestRate * durationMonths;

    // Amount actually given to borrower (principal - interest)
    const amountGiven = principal - totalInterest;

    // Total amount to be repaid (original principal)
    const totalAmountToRepay = principal;

    const installments = [];
    let remainingPrincipal = totalAmountToRepay;
    let remainingInterest = totalInterest;

    for (let i = 0; i < numberOfInstallments; i++) {
      const dueDate = new Date(startDate);
      if (isDaily) {
        dueDate.setDate(dueDate.getDate() + i + 1); // Add 1 day for daily
      } else if (isWeekly) {
        dueDate.setDate(dueDate.getDate() + i * 7); // Add 7 days for weekly
      } else {
        dueDate.setMonth(dueDate.getMonth() + i + 1); // Add months for monthly
      }

      // Calculate interest for this installment
      const interest = remainingInterest / (numberOfInstallments - i);

      // Calculate principal for this installment
      const principalPayment = remainingPrincipal / (numberOfInstallments - i);

      // Our Principal Amount is the amount given

      // Total installment amount
      const amount = principalPayment;
      const installmentAmount = principalPayment;

      installments.push({
        dueDate: dueDate.toISOString().split("T")[0],
        amount: amount,
        principal: principalPayment - interest,
        interest: interest,
        installmentAmount: installmentAmount,
      });

      remainingPrincipal -= principalPayment;
      remainingInterest -= interest;
    }

    setInstallmentDetails({
      totalAmount: totalAmountToRepay,
      totalInterest,
      actualAmountReceived: principal,
      amountGiven,
      installments,
    });
  }, [formData]);

  useEffect(() => {
    calculateInstallments();
  }, [calculateInstallments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!installmentDetails) {
      setFormError("Please fill in all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/borrowers/${id}/loans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          principalAmount: parseFloat(formData.principalAmount),
          interestRate: parseFloat(formData.interestRate),
          termMonths: parseInt(formData.loanDurationMonths),
          startDate: formData.startDate,
          frequency: formData.repaymentFrequency,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add loan");
      }

      // Reset form and refresh borrower details
      setFormData({
        principalAmount: "",
        interestRate: "",
        repaymentFrequency: "MONTHLY",
        startDate: new Date().toISOString().split("T")[0],
        loanDurationMonths: "4",
      });
      setInstallmentDetails(null);

      // Refresh borrower details
      const borrowerRes = await fetch(`/api/admin/borrowers/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!borrowerRes.ok) {
        throw new Error("Failed to fetch updated borrower details");
      }

      const borrowerData = await borrowerRes.json();
      setBorrower(borrowerData);
      // Set the first loan to be expanded by default
      if (borrowerData.loans && borrowerData.loans.length > 0) {
        setExpandedLoans({ [borrowerData.loans[0].id]: true });
      }

      // Switch back to loans tab
      setActiveTab("loans");
    } catch (error) {
      console.error("Error adding loan:", error);
      setFormError(
        error instanceof Error ? error.message : "Failed to add loan"
      );
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "PENDING":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case "OVERDUE":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const toggleLoanExpansion = (loanId: string) => {
    setExpandedLoans((prev) => ({
      ...prev,
      [loanId]: !prev[loanId],
    }));
  };

  // Sort loans by start date (most recent first)
  const sortedLoans = borrower?.loans || [];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!borrower) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-lg text-gray-500">Borrower not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Borrower Header */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
              <UserIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {borrower.name}
              </h1>
              <p className="text-sm text-gray-500">ID: {borrower.id}</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("newLoan")}
            className="flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            <PlusCircleIcon className="mr-2 h-5 w-5" />
            New Loan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("loans")}
              className={`flex items-center border-b-2 px-4 py-4 text-sm font-medium ${
                activeTab === "loans"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <CreditCardIcon className="mr-2 h-5 w-5" />
              Loan History
            </button>
            <button
              onClick={() => setActiveTab("details")}
              className={`flex items-center border-b-2 px-4 py-4 text-sm font-medium ${
                activeTab === "details"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <UserIcon className="mr-2 h-5 w-5" />
              Borrower Details
            </button>
            <button
              onClick={() => setActiveTab("newLoan")}
              className={`flex items-center border-b-2 px-4 py-4 text-sm font-medium ${
                activeTab === "newLoan"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <PlusCircleIcon className="mr-2 h-5 w-5" />
              New Loan
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "details" && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-500">
                  Personal Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Father's Name</p>
                    <p className="text-base font-medium text-gray-900">
                      {borrower.fatherName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-base font-medium text-gray-900">
                      {borrower.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">PAN ID</p>
                    <p className="text-base font-medium text-gray-900">
                      {borrower.panId}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-500">
                  Address
                </h3>
                <p className="text-base text-gray-900">{borrower.address}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-500">
                  Agent
                </h3>
                <p className="text-base font-medium text-gray-900">
                  {borrower.agent.user.name}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-500">
                  Loan Summary
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Total Loans</p>
                    <p className="text-base font-medium text-gray-900">
                      {borrower.loans.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Loans</p>
                    <p className="text-base font-medium text-gray-900">
                      {
                        borrower.loans.filter(
                          (loan) => loan.status === "ACTIVE"
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "loans" && (
            <div>
              {borrower.loans.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-12 text-center">
                  <CreditCardIcon className="h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No loans
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new loan.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setActiveTab("newLoan")}
                      className="flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                      <PlusCircleIcon className="mr-2 h-5 w-5" />
                      New Loan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedLoans.map((loan) => (
                    <div
                      key={loan.id}
                      className="rounded-lg border border-gray-200 overflow-hidden"
                    >
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                        onClick={() => toggleLoanExpansion(loan.id)}
                      >
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Loan #{loan.id.substring(0, 8)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Started on {formatDate(loan.startDate)}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <div className="text-right mr-4">
                            <p className="text-lg font-medium text-gray-900">
                              {formatCurrency(loan.principalAmount)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {loan.interestRate}% interest
                            </p>
                          </div>
                          {expandedLoans[loan.id] ? (
                            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {expandedLoans[loan.id] && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                          <h4 className="mb-2 text-sm font-medium text-gray-500">
                            Installments
                          </h4>
                          <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Due Date
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Installment
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Principal
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Interest
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Total Amount
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {loan.installments.map((installment) => (
                                  <tr key={installment.id}>
                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                                      {formatDate(installment.dueDate)}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                                      {formatCurrency(
                                        installment.installmentAmount
                                      )}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                                      {formatCurrency(installment.principal)}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                                      {formatCurrency(installment.interest)}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                                      {formatCurrency(installment.amount)}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                                      <div className="flex items-center">
                                        {getStatusIcon(installment.status)}
                                        <span className="ml-2">
                                          {installment.status}
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "newLoan" && (
            <div className="rounded-lg border border-gray-200 p-6">
              <h2 className="mb-6 text-lg font-medium text-gray-900">
                Create New Loan
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="principalAmount"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Principal Amount
                    </label>
                    <div className="mt-1">
                      <Input
                        type="number"
                        id="principalAmount"
                        name="principalAmount"
                        value={formData.principalAmount}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="interestRate"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Interest Rate (%)
                    </label>
                    <div className="mt-1">
                      <Input
                        type="number"
                        id="interestRate"
                        name="interestRate"
                        value={formData.interestRate}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Start Date
                    </label>
                    <div className="mt-1">
                      <Input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="loanDurationMonths"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Loan Duration (months)
                    </label>
                    <div className="mt-1">
                      <Select
                        value={formData.loanDurationMonths}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            loanDurationMonths: value,
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 months</SelectItem>
                          <SelectItem value="4">4 months</SelectItem>
                          <SelectItem value="6">6 months</SelectItem>
                          <SelectItem value="12">12 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="repaymentFrequency"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Repayment Frequency
                    </label>
                    <div className="mt-1">
                      <Select
                        value={formData.repaymentFrequency}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            repaymentFrequency: value,
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                          <SelectItem value="DAILY">Daily</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {formError && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Error
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          {formError}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {installmentDetails && (
                  <div className="rounded-lg border border-gray-200 p-4">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">
                      Loan Preview
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="text-sm font-medium text-gray-500">
                          Principal Amount
                        </p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {formatCurrency(
                            installmentDetails.actualAmountReceived
                          )}
                        </p>
                      </div>
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="text-sm font-medium text-gray-500">
                          Amount Given
                        </p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {formatCurrency(installmentDetails.amountGiven)}
                        </p>
                      </div>
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="text-sm font-medium text-gray-500">
                          Total Interest
                        </p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {formatCurrency(installmentDetails.totalInterest)}
                        </p>
                      </div>
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="text-sm font-medium text-gray-500">
                          Installments
                        </p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {installmentDetails.installments.length}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="mb-2 text-sm font-medium text-gray-500">
                        Installment Schedule
                      </h4>
                      <div className="overflow-hidden rounded-md border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Due Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Installment
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Amount
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Principal
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Interest
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {installmentDetails.installments.map(
                              (installment, index) => (
                                <tr key={index}>
                                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                                    {formatDate(installment.dueDate)}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                                    {formatCurrency(
                                      installment.installmentAmount
                                    )}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                                    {formatCurrency(installment.amount)}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                                    {formatCurrency(installment.principal)}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                                    {formatCurrency(installment.interest)}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab("loans")}
                    className="mr-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                  >
                    Create Loan
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
