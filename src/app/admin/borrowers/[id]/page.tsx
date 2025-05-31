"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  UserIcon,
  CreditCardIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarIcon,
  TrashIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BorrowerDetailsSkeleton } from "@/components/dashboard/BorrowerDetailsSkeleton";
import { Timer } from "lucide-react";

interface Loan {
  id: string;
  principalAmount: number;
  interestRate: number;
  status: string;
  startDate: string;
  createdAt: string;
  frequency: string;
  installments: {
    id: string;
    dueDate: string;
    dueAmount: number;
    amount: number;
    status: string;
    principal: number;
    interest: number;
    installmentAmount: number;
    extraAmount: number;
    penaltyAmount: number;
    paidAt?: string;
  }[];
}

interface Borrower {
  id: string;
  name: string;
  guarantorName: string;
  phone: string;
  address: string;
  panId: string;
  agent: {
    user: {
      name: string;
    };
  };
  loans: Loan[];
  activeLoans: number;
}

interface InstallmentDetails {
  totalAmount: number;
  totalInterest: number;
  actualAmountReceived: number;
  amountGiven: number;
  installments: {
    dueDate: string;
    dueAmount: number;
    amount: number;
    principal: number;
    interest: number;
    installmentAmount: number;
  }[];
}

export default function BorrowerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
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
    createdDate: new Date().toISOString().split("T")[0],
  });
  const [formError, setFormError] = useState("");
  const [installmentDetails, setInstallmentDetails] =
    useState<InstallmentDetails | null>(null);
  const [settlementDialog, setSettlementDialog] = useState<{
    isOpen: boolean;
    loanId: string | null;
    pendingAmount: number;
    pendingInstallments: number;
    checkedItems: {
      pendingInstallments: boolean;
      differenceInAmounts: boolean;
      penalties: boolean;
    };
    settlementType: "automatic" | "manual";
    manualSettlement: {
      amount: string;
      extraMoney: string;
      penalty: string;
      interest: string;
    };
  }>({
    isOpen: false,
    loanId: null,
    pendingAmount: 0,
    pendingInstallments: 0,
    checkedItems: {
      pendingInstallments: false,
      differenceInAmounts: false,
      penalties: false,
    },
    settlementType: "automatic",
    manualSettlement: {
      amount: "",
      extraMoney: "",
      penalty: "",
      interest: "",
    },
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showLoanDeleteDialog, setShowLoanDeleteDialog] = useState<{
    isOpen: boolean;
    loanId: string | null;
  }>({
    isOpen: false,
    loanId: null,
  });
  const [loanDeleteError, setLoanDeleteError] = useState("");

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
    const isMonthly = formData.repaymentFrequency === "MONTHLY";

    const direct = isDaily || isMonthly;
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
        dueDate.setDate(dueDate.getDate() + i); // Add 1 day for daily
      } else if (isWeekly) {
        dueDate.setDate(dueDate.getDate() + i * 7); // Add 7 days for weekly
      } else {
        dueDate.setMonth(dueDate.getMonth() + i); // Add months for monthly
      }

      // Calculate interest for this installment
      const interest = remainingInterest / (numberOfInstallments - i);
      // For monthly repayments, set all values to 0
      if (isMonthly) {
        installments.push({
          dueDate: dueDate.toISOString().split("T")[0],
          amount: 0,
          principal: 0,
          interest: interest,
          installmentAmount: 0,
          dueAmount: 0,
        });
        break;
      }

      // Calculate principal for this installment
      const principalPayment = remainingPrincipal / (numberOfInstallments - i);

      // Total installment amount
      const amount = direct ? principalPayment + interest : principalPayment;
      const installmentAmount = direct
        ? principalPayment + interest
        : principalPayment;

      installments.push({
        dueDate: dueDate.toISOString().split("T")[0],
        amount: amount,
        principal: direct ? principalPayment : principalPayment - interest,
        interest: interest,
        installmentAmount: installmentAmount,
        dueAmount: 0,
      });

      remainingPrincipal -= principalPayment;
      remainingInterest -= interest;
    }

    setInstallmentDetails({
      totalAmount: totalAmountToRepay,
      totalInterest,
      actualAmountReceived: principal,
      amountGiven: direct ? amountGiven + totalInterest : amountGiven,
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
          createdAt: formData.createdDate,
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
        createdDate: new Date().toISOString().split("T")[0],
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "startDate"
          ? value || new Date().toISOString().split("T")[0]
          : value,
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "PENDING":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case "OVERDUE":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case "SKIPPED":
        return <ExclamationCircleIcon className="h-5 w-5  text-red-500" />;
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

  const handleSettleLoan = async (loanId: string) => {
    const loan = borrower?.loans.find((l) => l.id === loanId);
    if (!loan) return;

    // Calculate pending amounts
    const pendingInstallments = loan.installments.filter(
      (inst) => inst.status !== "PAID"
    );
    const pendingAmount = pendingInstallments.reduce(
      (sum, inst) => sum + inst.amount + inst.extraAmount + inst.penaltyAmount,
      0
    );

    setSettlementDialog({
      isOpen: true,
      loanId,
      pendingAmount,
      pendingInstallments: pendingInstallments.length,
      checkedItems: {
        pendingInstallments: false,
        differenceInAmounts: false,
        penalties: false,
      },
      settlementType: "automatic",
      manualSettlement: {
        amount: "",
        extraMoney: "",
        penalty: "",
        interest: "",
      },
    });
  };

  const toggleCheckedItem = (
    item: keyof typeof settlementDialog.checkedItems
  ) => {
    setSettlementDialog((prev) => ({
      ...prev,
      checkedItems: {
        ...prev.checkedItems,
        [item]: !prev.checkedItems[item],
      },
    }));
  };

  const confirmSettlement = async () => {
    if (!settlementDialog.loanId) return;

    try {
      const loan = borrower?.loans.find(
        (l) => l.id === settlementDialog.loanId
      );
      if (!loan) return;

      const paidInstallments = loan.installments.filter(
        (inst) => inst.status == "PAID"
      );
      const totalCollected = paidInstallments.reduce(
        (sum, inst) => sum + inst.amount + inst.extraAmount - inst.dueAmount,
        0
      );

      const totalPenalties = loan.installments.reduce(
        (sum, inst) => sum + inst.penaltyAmount,
        0
      );

      const differenceInAmounts =
        loan.principalAmount - totalCollected - settlementDialog.pendingAmount;

      const pendingInstallments = loan.installments.filter(
        (inst) => inst.status !== "PAID"
      );
      const pendingInstallmentAmount = pendingInstallments.reduce(
        (sum, inst) =>
          sum + inst.amount + inst.extraAmount + inst.penaltyAmount,
        0
      );

      // alert(
      //   JSON.stringify({
      //     markPendingAsPaid: pendingInstallmentAmount > 0,
      //     extraAmount: differenceInAmounts,
      //     penaltyAmount: totalPenalties,
      //     amount:
      //       differenceInAmounts + totalPenalties + pendingInstallmentAmount,
      //   })
      // );

      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/admin/loans/${settlementDialog.loanId}/settle`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            settlementType: "AUTOMATIC",
            markPendingAsPaid: true,
            extraAmount: differenceInAmounts,
            penaltyAmount: totalPenalties,
            amount:
              differenceInAmounts + totalPenalties + pendingInstallmentAmount,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to settle loan");
      }

      // Refresh borrower details to update the UI
      const borrowerRes = await fetch(`/api/admin/borrowers/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!borrowerRes.ok) {
        throw new Error("Failed to fetch updated borrower details");
      }

      const data = await borrowerRes.json();
      setBorrower(data);
      setSettlementDialog({
        isOpen: false,
        loanId: null,
        pendingAmount: 0,
        pendingInstallments: 0,
        checkedItems: {
          pendingInstallments: false,
          differenceInAmounts: false,
          penalties: false,
        },
        settlementType: "automatic",
        manualSettlement: {
          amount: "",
          extraMoney: "",
          penalty: "",
          interest: "",
        },
      });
      toast.success("Loan settled successfully");
    } catch (error) {
      console.error("Error settling loan:", error);
      toast.error("Failed to settle loan");
    }
  };

  const handleManualSettlement = async () => {
    if (!settlementDialog.loanId) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/admin/loans/${settlementDialog.loanId}/settle`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            settlementType: "MANUAL",
            markPendingAsPaid: true,
            extraAmount:
              parseFloat(settlementDialog.manualSettlement.extraMoney) || 0,
            penaltyAmount:
              parseFloat(settlementDialog.manualSettlement.penalty) || 0,
            amount: parseFloat(settlementDialog.manualSettlement.amount) || 0,
            interest:
              parseFloat(settlementDialog.manualSettlement.interest) || 0,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to settle loan");
      }

      // Refresh borrower details to update the UI
      const borrowerRes = await fetch(`/api/admin/borrowers/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!borrowerRes.ok) {
        throw new Error("Failed to fetch updated borrower details");
      }

      const data = await borrowerRes.json();
      setBorrower(data);
      setSettlementDialog({
        isOpen: false,
        loanId: null,
        pendingAmount: 0,
        pendingInstallments: 0,
        checkedItems: {
          pendingInstallments: false,
          differenceInAmounts: false,
          penalties: false,
        },
        settlementType: "automatic",
        manualSettlement: {
          amount: "",
          extraMoney: "",
          penalty: "",
          interest: "",
        },
      });
      toast.success("Loan settled successfully");
    } catch (error) {
      console.error("Error settling loan:", error);
      toast.error("Failed to settle loan");
    }
  };

  const handleDeleteBorrower = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/borrowers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete borrower");
      }

      router.push("/admin/borrowers");
    } catch (error) {
      console.error("Error deleting borrower:", error);
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete borrower"
      );
    }
  };

  const handleDeleteLoan = async () => {
    if (!showLoanDeleteDialog.loanId) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/admin/loans/${showLoanDeleteDialog.loanId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete loan");
      }

      // Refresh borrower details to update the UI
      const borrowerRes = await fetch(`/api/admin/borrowers/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!borrowerRes.ok) {
        throw new Error("Failed to fetch updated borrower details");
      }

      const data = await borrowerRes.json();
      setBorrower(data);
      setShowLoanDeleteDialog({
        isOpen: false,
        loanId: null,
      });
      toast.success("Loan deleted successfully");
    } catch (error) {
      console.error("Error deleting loan:", error);
      setLoanDeleteError(
        error instanceof Error ? error.message : "Failed to delete loan"
      );
    }
  };

  // Sort loans by start date (most recent first)
  const sortedLoans = borrower?.loans || [];

  if (loading) {
    return <BorrowerDetailsSkeleton />;
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
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab("newLoan")}
              className="flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              <PlusCircleIcon className="mr-2 h-5 w-5" />
              New Loan
            </button>
          </div>
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
                    <p className="text-sm text-gray-500">
                      Guarantor&apos;s Name
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {borrower.guarantorName}
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
              <div className="col-span-2">
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 text-sm font-medium text-gray-500">
                    Actions
                  </h3>
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                  >
                    <TrashIcon className="mr-2 h-5 w-5" />
                    Delete Borrower
                  </button>
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
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              Loan #{loan.id.substring(0, 8)}
                            </h3>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                loan.status === "ACTIVE"
                                  ? "bg-green-100 text-green-800"
                                  : loan.status === "SETTLED"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {loan.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <ClockIcon className="h-4 w-4 text-gray-400" />
                              <p className="text-sm text-gray-500">
                                Created on {formatDate(loan.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-gray-400" />
                              <p className="text-sm text-gray-500">
                                Started on {formatDate(loan.startDate)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Timer className="h-4 w-4 text-gray-400" />
                              <p className="text-sm text-gray-500">
                                Repayment Frequency{" "}
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800  `}
                                >
                                  {loan.frequency}
                                </span>
                              </p>
                            </div>
                          </div>
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
                          <div className="mb-6 grid grid-cols-4 gap-4">
                            <div className="rounded-lg bg-white p-4 shadow-sm">
                              <h5 className="text-sm font-medium text-gray-500">
                                Total Collected{" "}
                                <Badge
                                  className="bg-green-100 text-green-800"
                                  cleared={loan.status === "ACTIVE"}
                                >
                                  {loan.status === "ACTIVE"
                                    ? "= I + E - D"
                                    : "I + E + D + P"}
                                </Badge>
                              </h5>
                              <p className="mt-1 text-xl font-semibold text-gray-900">
                                {loan.status === "ACTIVE"
                                  ? formatCurrency(
                                      loan.installments
                                        .filter(
                                          (inst) => inst.status === "PAID"
                                        )
                                        .reduce(
                                          (sum, inst) =>
                                            sum +
                                            inst.amount +
                                            inst.extraAmount -
                                            inst.dueAmount,
                                          0
                                        )
                                    )
                                  : formatCurrency(
                                      loan.installments
                                        .filter(
                                          (inst) => inst.status === "PAID"
                                        )
                                        .reduce(
                                          (sum, inst) =>
                                            sum +
                                            inst.amount +
                                            inst.penaltyAmount +
                                            inst.extraAmount +
                                            inst.dueAmount,
                                          0
                                        )
                                    )}
                              </p>
                            </div>

                            <div className="rounded-lg bg-white p-4 shadow-sm">
                              <h5 className="text-sm font-medium text-gray-500">
                                Extra Money
                              </h5>
                              <p className="mt-1 text-xl font-semibold text-gray-900">
                                {formatCurrency(
                                  loan.installments
                                    .filter((inst) => inst.status === "PAID")
                                    .reduce(
                                      (sum, inst) => sum + inst.extraAmount,
                                      0
                                    )
                                )}
                              </p>
                            </div>
                            <div className="rounded-lg bg-white p-4 shadow-sm">
                              <h5 className="text-sm font-medium text-gray-500">
                                Due Amount{" "}
                              </h5>
                              <p className="mt-1 text-xl font-semibold text-gray-900">
                                {formatCurrency(
                                  loan.installments
                                    .filter((inst) => inst.status === "PAID")
                                    .reduce(
                                      (sum, inst) => sum + inst.dueAmount,
                                      0
                                    )
                                )}
                              </p>
                            </div>
                            <div className="rounded-lg bg-white p-4 shadow-sm">
                              <h5 className="text-sm font-medium text-gray-500">
                                Penalties{" "}
                                <Badge
                                  className="bg-green-100 text-green-800"
                                  cleared={loan.status === "ACTIVE"}
                                >
                                  {loan.status === "ACTIVE"
                                    ? "Not Cleared"
                                    : "Cleared"}
                                </Badge>
                              </h5>
                              <p className="mt-1 text-xl font-semibold text-gray-900">
                                {formatCurrency(
                                  loan.installments
                                    .filter((inst) => inst.status === "PAID")
                                    .reduce(
                                      (sum, inst) => sum + inst.penaltyAmount,
                                      0
                                    )
                                )}
                              </p>
                            </div>
                          </div>
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
                                    Paid Date
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
                                    Extra Money
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Penalty
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Due Amount
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
                                      {installment.paidAt
                                        ? formatDate(installment.paidAt)
                                        : "-"}
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
                                      {installment.extraAmount > 0 ? (
                                        <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                          {formatCurrency(
                                            installment.extraAmount
                                          )}
                                        </span>
                                      ) : (
                                        formatCurrency(0)
                                      )}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                                      {installment.penaltyAmount > 0 ? (
                                        <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                          {formatCurrency(
                                            installment.penaltyAmount
                                          )}
                                        </span>
                                      ) : (
                                        formatCurrency(0)
                                      )}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                                      {installment.dueAmount > 0 ? (
                                        <span className="inline-flex items-center rounded-md bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                                          {formatCurrency(
                                            installment.dueAmount
                                          )}
                                        </span>
                                      ) : (
                                        formatCurrency(0)
                                      )}
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
                          {loan.status === "ACTIVE" && (
                            <div className="mt-4 flex justify-between space-x-3">
                              <button
                                onClick={() =>
                                  setShowLoanDeleteDialog({
                                    isOpen: true,
                                    loanId: loan.id,
                                  })
                                }
                                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                              >
                                Delete Loan
                              </button>
                              <button
                                onClick={() => handleSettleLoan(loan.id)}
                                className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
                              >
                                Settle Loan
                              </button>
                            </div>
                          )}
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
                        placeholder="Enter Principal Amount"
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
                        placeholder="Enter Interest Rate"
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
                      EMI Start Date
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
                      htmlFor="createdDate"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Created Date
                    </label>
                    <div className="mt-1">
                      <Input
                        type="date"
                        id="createdDate"
                        name="createdDate"
                        value={formData.createdDate}
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
                      <Input
                        type="number"
                        id="loanDurationMonths"
                        name="loanDurationMonths"
                        value={formData.loanDurationMonths}
                        placeholder="Enter loan duration in months"
                        onChange={handleInputChange}
                        min="1"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                      />
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
                          {formData.repaymentFrequency === "MONTHLY"
                            ? "On Settlement"
                            : formatCurrency(
                                formData.repaymentFrequency === "DAILY"
                                  ? installmentDetails.actualAmountReceived +
                                      installmentDetails.totalInterest
                                  : installmentDetails.actualAmountReceived
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
                          {formData.repaymentFrequency === "MONTHLY"
                            ? "On Settlement"
                            : installmentDetails.totalInterest > 0
                            ? formatCurrency(installmentDetails.totalInterest)
                            : "No Interest"}
                        </p>
                      </div>
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="text-sm font-medium text-gray-500">
                          Installments
                        </p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {formData.repaymentFrequency === "MONTHLY"
                            ? `Till Settlement`
                            : installmentDetails.installments.length}
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

      {/* Settlement Dialog */}
      <Dialog
        open={settlementDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSettlementDialog({
              isOpen: false,
              loanId: null,
              pendingAmount: 0,
              pendingInstallments: 0,
              checkedItems: {
                pendingInstallments: false,
                differenceInAmounts: false,
                penalties: false,
              },
              settlementType: "automatic",
              manualSettlement: {
                amount: "",
                extraMoney: "",
                penalty: "",
                interest: "",
              },
            });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loan Settlement Summary</DialogTitle>
            <DialogDescription>
              {settlementDialog.loanId && borrower && (
                <div className="space-y-4">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                      <button
                        onClick={() =>
                          setSettlementDialog((prev) => ({
                            ...prev,
                            settlementType: "automatic",
                          }))
                        }
                        className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                          settlementDialog.settlementType === "automatic"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        }`}
                      >
                        Systematic Settlement
                      </button>
                      <button
                        onClick={() =>
                          setSettlementDialog((prev) => ({
                            ...prev,
                            settlementType: "manual",
                          }))
                        }
                        className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                          settlementDialog.settlementType === "manual"
                            ? "border-indigo-500 text-indigo-600"
                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        }`}
                      >
                        Manual Settlement
                      </button>
                    </nav>
                  </div>

                  {settlementDialog.settlementType === "automatic" ? (
                    (() => {
                      const loan = borrower.loans.find(
                        (l) => l.id === settlementDialog.loanId
                      );
                      if (!loan) return null;

                      const paidInstallments = loan.installments.filter(
                        (inst) => inst.status === "PAID"
                      );
                      const pendingInstallments = loan.installments.filter(
                        (inst) => inst.status !== "PAID"
                      );

                      const totalCollected = paidInstallments.reduce(
                        (sum, inst) =>
                          sum + inst.amount + inst.extraAmount - inst.dueAmount,
                        0
                      );

                      const totalDueAmount = loan.installments.reduce(
                        (sum, inst) => sum + inst.dueAmount,
                        0
                      );

                      const totalPenalties = loan.installments.reduce(
                        (sum, inst) => sum + inst.penaltyAmount,
                        0
                      );

                      const totalExtra = loan.installments.reduce(
                        (sum, inst) => sum + inst.extraAmount,
                        0
                      );

                      const amountToBeCollected =
                        loan.principalAmount -
                        totalCollected -
                        settlementDialog.pendingAmount;

                      const isYellow =
                        settlementDialog.pendingInstallments > 0 ||
                        amountToBeCollected > 0 ||
                        totalPenalties > 0;

                      // Calculate allPresentItemsChecked directly
                      const presentItems = {
                        pendingInstallments:
                          settlementDialog.pendingInstallments > 0,
                        differenceInAmounts: amountToBeCollected > 0,
                        penalties: totalPenalties > 0,
                      };

                      const allPresentItemsChecked = Object.entries(
                        presentItems
                      ).every(
                        ([key, isPresent]) =>
                          !isPresent ||
                          settlementDialog.checkedItems[
                            key as keyof typeof settlementDialog.checkedItems
                          ]
                      );

                      // Calculate additional collected amounts from checked items
                      const additionalCollected =
                        (settlementDialog.checkedItems.pendingInstallments
                          ? settlementDialog.pendingAmount
                          : 0) +
                        (settlementDialog.checkedItems.differenceInAmounts
                          ? amountToBeCollected
                          : 0) +
                        (settlementDialog.checkedItems.penalties
                          ? totalPenalties
                          : 0);

                      // Calculate adjusted amounts based on checked items
                      const adjustedPendingAmount = settlementDialog
                        .checkedItems.pendingInstallments
                        ? 0
                        : settlementDialog.pendingAmount;
                      const adjustedDifferenceAmount = settlementDialog
                        .checkedItems.differenceInAmounts
                        ? 0
                        : amountToBeCollected;
                      const adjustedPenalties = settlementDialog.checkedItems
                        .penalties
                        ? 0
                        : totalPenalties;

                      const totalAdjustedAmount =
                        adjustedPendingAmount +
                        adjustedDifferenceAmount +
                        adjustedPenalties;

                      return (
                        <div className="space-y-4">
                          <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <div className="space-y-2">
                              <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-600">
                                  Loan Value
                                </span>
                                <span className="font-medium">
                                  {formatCurrency(loan.principalAmount)}
                                </span>
                              </div>
                              <div className="space-y-1 border-b border-gray-100 pb-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Total Collected
                                  </span>
                                  <span className="font-medium text-green-600">
                                    +{" "}
                                    {formatCurrency(
                                      totalCollected + additionalCollected
                                    )}
                                  </span>
                                </div>
                                {totalExtra > 0 && (
                                  <div className="flex justify-between pl-4">
                                    <span className="text-gray-500 text-sm">
                                      Extra Amount
                                    </span>
                                    <span className="font-medium text-gray-500 text-sm">
                                      + {formatCurrency(totalExtra)}
                                    </span>
                                  </div>
                                )}
                                {totalDueAmount > 0 && (
                                  <div className="flex justify-between pl-4">
                                    <span className="text-gray-500 text-sm">
                                      Due Amount
                                    </span>
                                    <span className="font-medium text-gray-500 text-sm">
                                      - {formatCurrency(totalDueAmount)}
                                    </span>
                                  </div>
                                )}

                                <div className="flex justify-between pl-4">
                                  <span className="text-gray-500 text-sm">
                                    Additional Collected
                                  </span>
                                  <span className="font-medium text-green-500 text-sm">
                                    + {formatCurrency(additionalCollected)}
                                  </span>
                                </div>
                              </div>
                              {totalAdjustedAmount > 0 && (
                                <div className="space-y-1 border-b border-gray-100 pb-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Amount to be Collected
                                    </span>
                                    <span className="font-medium text-red-600">
                                      - {formatCurrency(totalAdjustedAmount)}
                                    </span>
                                  </div>
                                  {settlementDialog.pendingInstallments > 0 && (
                                    <div
                                      className={`flex justify-between pl-4 ${
                                        settlementDialog.checkedItems
                                          .pendingInstallments
                                          ? "line-through text-gray-400"
                                          : ""
                                      }`}
                                    >
                                      <span className="text-gray-500 text-sm">
                                        Pending Installments (
                                        {formatCurrency(
                                          settlementDialog.pendingAmount /
                                            pendingInstallments.length
                                        )}{" "}
                                        x {pendingInstallments.length})
                                      </span>
                                      <span className="font-medium text-gray-500 text-sm">
                                        -{" "}
                                        {formatCurrency(
                                          settlementDialog.pendingAmount
                                        )}
                                      </span>
                                    </div>
                                  )}

                                  {amountToBeCollected > 0 && (
                                    <div
                                      className={`flex justify-between pl-4 ${
                                        settlementDialog.checkedItems
                                          .differenceInAmounts
                                          ? "line-through text-gray-400"
                                          : ""
                                      }`}
                                    >
                                      <span className="text-gray-500 text-sm">
                                        Difference in Installment Amounts
                                      </span>
                                      <span className="font-medium text-gray-500 text-sm">
                                        - {formatCurrency(amountToBeCollected)}
                                      </span>
                                    </div>
                                  )}
                                  {totalPenalties > 0 && (
                                    <div
                                      className={`flex justify-between pl-4 ${
                                        settlementDialog.checkedItems.penalties
                                          ? "line-through text-gray-400"
                                          : ""
                                      }`}
                                    >
                                      <span className="text-gray-500 text-sm">
                                        Penalties
                                      </span>
                                      <span className="font-medium text-gray-500 text-sm">
                                        - {formatCurrency(totalPenalties)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {isYellow && (
                            <div className="rounded-md bg-yellow-50 p-4">
                              {settlementDialog.pendingInstallments > 0 && (
                                <div className="flex items-start">
                                  <div className="flex h-6 items-center">
                                    <input
                                      type="checkbox"
                                      checked={
                                        settlementDialog.checkedItems
                                          .pendingInstallments
                                      }
                                      onChange={() =>
                                        toggleCheckedItem("pendingInstallments")
                                      }
                                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                    />
                                  </div>
                                  <div
                                    onClick={() => {
                                      toggleCheckedItem("pendingInstallments");
                                    }}
                                    className="ml-3 cursor-pointer text-left"
                                  >
                                    <h3 className="text-sm font-medium text-yellow-800 ">
                                      Pending Installments
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                      <p>
                                        {settlementDialog.pendingInstallments}{" "}
                                        installments pending (
                                        {formatCurrency(
                                          settlementDialog.pendingAmount
                                        )}
                                        )
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {amountToBeCollected > 0 && (
                                <div className="flex items-start mt-4">
                                  <div className="flex h-6 items-center">
                                    <input
                                      type="checkbox"
                                      checked={
                                        settlementDialog.checkedItems
                                          .differenceInAmounts
                                      }
                                      onChange={() =>
                                        toggleCheckedItem("differenceInAmounts")
                                      }
                                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                    />
                                  </div>
                                  <div
                                    onClick={() => {
                                      toggleCheckedItem("differenceInAmounts");
                                    }}
                                    className="ml-3 cursor-pointer"
                                  >
                                    <h3 className="text-sm font-medium text-yellow-800">
                                      Difference in Installment Amounts
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                      <p>
                                        Amount to be collected:{" "}
                                        {formatCurrency(amountToBeCollected)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {totalPenalties > 0 && (
                                <div className="flex items-start mt-4">
                                  <div className="flex h-6 items-center">
                                    <input
                                      type="checkbox"
                                      checked={
                                        settlementDialog.checkedItems.penalties
                                      }
                                      onChange={() =>
                                        toggleCheckedItem("penalties")
                                      }
                                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                    />
                                  </div>
                                  <div
                                    onClick={() => {
                                      toggleCheckedItem("penalties");
                                    }}
                                    className="ml-3 cursor-pointer"
                                  >
                                    <h3 className="text-sm font-medium text-yellow-800">
                                      Penalties to be Collected
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                      <p>
                                        Penalty amount:{" "}
                                        {formatCurrency(totalPenalties)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <DialogFooter>
                            <button
                              onClick={() =>
                                setSettlementDialog({
                                  isOpen: false,
                                  loanId: null,
                                  pendingAmount: 0,
                                  pendingInstallments: 0,
                                  checkedItems: {
                                    pendingInstallments: false,
                                    differenceInAmounts: false,
                                    penalties: false,
                                  },
                                  settlementType: "automatic",
                                  manualSettlement: {
                                    amount: "",
                                    extraMoney: "",
                                    penalty: "",
                                    interest: "",
                                  },
                                })
                              }
                              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={confirmSettlement}
                              disabled={!allPresentItemsChecked}
                              className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {settlementDialog.pendingInstallments > 0
                                ? "Mark as Paid & Settle"
                                : "Settle Loan"}
                            </button>
                          </DialogFooter>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="space-y-4">
                          <div>
                            <label
                              htmlFor="amount"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Amount
                            </label>
                            <div className="mt-1">
                              <Input
                                type="number"
                                id="amount"
                                value={settlementDialog.manualSettlement.amount}
                                onChange={(e) =>
                                  setSettlementDialog((prev) => ({
                                    ...prev,
                                    manualSettlement: {
                                      ...prev.manualSettlement,
                                      amount: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="Enter amount"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label
                              htmlFor="extraMoney"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Extra Money
                            </label>
                            <div className="mt-1">
                              <Input
                                type="number"
                                id="extraMoney"
                                value={
                                  settlementDialog.manualSettlement.extraMoney
                                }
                                onChange={(e) =>
                                  setSettlementDialog((prev) => ({
                                    ...prev,
                                    manualSettlement: {
                                      ...prev.manualSettlement,
                                      extraMoney: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="Enter extra money"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label
                              htmlFor="penalty"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Penalty
                            </label>
                            <div className="mt-1">
                              <Input
                                type="number"
                                id="penalty"
                                value={
                                  settlementDialog.manualSettlement.penalty
                                }
                                onChange={(e) =>
                                  setSettlementDialog((prev) => ({
                                    ...prev,
                                    manualSettlement: {
                                      ...prev.manualSettlement,
                                      penalty: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="Enter penalty"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label
                              htmlFor="interest"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Interest
                            </label>
                            <div className="mt-1">
                              <Input
                                type="number"
                                id="interest"
                                value={
                                  settlementDialog.manualSettlement.interest
                                }
                                onChange={(e) =>
                                  setSettlementDialog((prev) => ({
                                    ...prev,
                                    manualSettlement: {
                                      ...prev.manualSettlement,
                                      interest: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="Enter interest"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {(() => {
                        const loan = borrower.loans.find(
                          (l) => l.id === settlementDialog.loanId
                        );
                        if (!loan) return null;

                        const paidInstallments = loan.installments.filter(
                          (inst) => inst.status === "PAID"
                        );

                        const totalCollected = paidInstallments.reduce(
                          (sum, inst) =>
                            sum +
                            inst.amount +
                            inst.extraAmount -
                            inst.dueAmount,
                          0
                        );

                        const totalPenalties = loan.installments.reduce(
                          (sum, inst) => sum + inst.penaltyAmount,
                          0
                        );

                        const amountToBeCollected =
                          loan.principalAmount -
                          totalCollected -
                          settlementDialog.pendingAmount;

                        const hasWarnings =
                          settlementDialog.pendingInstallments > 0 ||
                          amountToBeCollected > 0 ||
                          totalPenalties > 0;

                        if (!hasWarnings) return null;

                        return (
                          <div className="rounded-md bg-red-50 p-4">
                            <h3 className="text-sm font-medium text-red-800 mb-4">
                              Warning: The following items need attention
                            </h3>
                            <div className="space-y-4">
                              {settlementDialog.pendingInstallments > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-red-700">
                                    Pending Installments
                                  </h4>
                                  <p className="mt-1 text-sm text-red-600">
                                    {settlementDialog.pendingInstallments}{" "}
                                    installments pending (
                                    {formatCurrency(
                                      settlementDialog.pendingAmount
                                    )}
                                    )
                                  </p>
                                </div>
                              )}
                              {amountToBeCollected > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-red-700">
                                    Difference in Installment Amounts
                                  </h4>
                                  <p className="mt-1 text-sm text-red-600">
                                    Amount to be collected:{" "}
                                    {formatCurrency(amountToBeCollected)}
                                  </p>
                                </div>
                              )}
                              {totalPenalties > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-red-700">
                                    Penalties to be Collected
                                  </h4>
                                  <p className="mt-1 text-sm text-red-600">
                                    Penalty amount:{" "}
                                    {formatCurrency(totalPenalties)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      <DialogFooter>
                        <button
                          onClick={() =>
                            setSettlementDialog({
                              isOpen: false,
                              loanId: null,
                              pendingAmount: 0,
                              pendingInstallments: 0,
                              checkedItems: {
                                pendingInstallments: false,
                                differenceInAmounts: false,
                                penalties: false,
                              },
                              settlementType: "automatic",
                              manualSettlement: {
                                amount: "",
                                extraMoney: "",
                                penalty: "",
                                interest: "",
                              },
                            })
                          }
                          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleManualSettlement}
                          disabled={!settlementDialog.manualSettlement.amount}
                          className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Settle Loan
                        </button>
                      </DialogFooter>
                    </div>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Borrower</DialogTitle>
            <DialogDescription>
              {deleteError ? (
                <div className="text-red-600">{deleteError}</div>
              ) : (
                <>
                  Are you sure you want to delete this borrower? This action
                  cannot be undone.
                  {borrower.loans.some((loan) => loan.status === "ACTIVE") && (
                    <div className="mt-2 text-yellow-600">
                      Warning: This borrower has active loans. You must settle
                      or cancel these loans before deleting the borrower.
                    </div>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setShowDeleteDialog(false)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteBorrower}
              disabled={borrower.loans.some((loan) => loan.status === "ACTIVE")}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loan Delete Confirmation Dialog */}
      <Dialog
        open={showLoanDeleteDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setShowLoanDeleteDialog({
              isOpen: false,
              loanId: null,
            });
            setLoanDeleteError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Loan</DialogTitle>
            <DialogDescription>
              {loanDeleteError ? (
                <div className="text-red-600">{loanDeleteError}</div>
              ) : (
                <>
                  Are you sure you want to delete this loan? This action cannot
                  be undone.
                  {borrower?.loans
                    .find((l) => l.id === showLoanDeleteDialog.loanId)
                    ?.installments.some((inst) => inst.status === "PAID") && (
                    <div className="mt-2 text-yellow-600">
                      Warning: This loan has paid installments. You cannot
                      delete a loan with paid installments.
                    </div>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => {
                setShowLoanDeleteDialog({
                  isOpen: false,
                  loanId: null,
                });
                setLoanDeleteError("");
              }}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteLoan}
              disabled={borrower?.loans
                .find((l) => l.id === showLoanDeleteDialog.loanId)
                ?.installments.some((inst) => inst.status === "PAID")}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Badge = ({
  children,
  className,
  cleared,
}: {
  children: React.ReactNode;
  className?: string;
  cleared?: boolean;
}) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className} ${
        !cleared
          ? "bg-green-100 text-green-800"
          : "bg-yellow-100 text-yellow-800"
      }`}
    >
      {children}
    </span>
  );
};
