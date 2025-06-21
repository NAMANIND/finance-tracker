"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import { format, startOfDay, endOfDay, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { ReportsSkeleton } from "@/components/dashboard/ReportsSkeleton";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
// We'll import xlsx dynamically when needed

interface Transaction {
  id: string;
  amount: number;
  type: "EXPENSE" | "INSTALLMENT" | "INCOME" | "CAPITAL";
  category: string;
  createdAt: string;
  notes?: string;
  name?: string;
  penaltyAmount: number;
  extraAmount: number;
  interest: number;
}

interface ReportStats {
  totalProfit: number;
  totalExpenses: number;
  totalInstallmetnsInterest: number;
  totalIncome: number;
  totalPenaltyAmount: number;
  openingBalance: number;
  totalCapital: number;
  totalLoanAmount: number;
  totalActiveLoansAmount: number;
  transactions: Transaction[];
}

interface RangeStats {
  profit: number;
  expenses: number;
  interest: number;
  income: number;
  penalty: number;
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });
  const [viewMode, setViewMode] = useState<
    "daily" | "yesterday" | "weekly" | "monthly" | "yearly" | "custom"
  >("daily");
  const [stats, setStats] = useState<ReportStats>({
    totalProfit: 0,
    totalExpenses: 0,
    totalInstallmetnsInterest: 0,
    totalIncome: 0,
    totalPenaltyAmount: 0,
    openingBalance: 0,
    totalCapital: 0,
    transactions: [],
    totalLoanAmount: 0,
    totalActiveLoansAmount: 0,
  });
  const [rangeStats, setRangeStats] = useState<RangeStats>({
    profit: 0,
    expenses: 0,
    interest: 0,
    income: 0,
    penalty: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<string>("");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [pendingDateRange, setPendingDateRange] = useState<
    DateRange | undefined
  >(dateRange);
  const getDateRangeForViewMode = (
    mode: typeof viewMode
  ): DateRange | undefined => {
    const today = new Date();
    let newDateRange: DateRange | undefined;

    switch (mode) {
      case "daily":
        newDateRange = {
          from: startOfDay(today),
          to: endOfDay(today),
        };
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        newDateRange = {
          from: startOfDay(yesterday),
          to: endOfDay(yesterday),
        };
        break;
      case "weekly":
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        newDateRange = {
          from: startOfDay(lastWeek),
          to: endOfDay(today),
        };
        break;
      case "monthly":
        newDateRange = {
          from: startOfDay(new Date(today.getFullYear(), today.getMonth(), 1)),
          to: endOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
        };
        break;
      case "yearly":
        newDateRange = {
          from: startOfDay(new Date(today.getFullYear(), 0, 1)),
          to: endOfDay(today),
        };
        break;
      case "custom":
        return undefined;
    }
    return newDateRange;
  };

  // Sync input fields when calendar changes (pendingDateRange)
  useEffect(() => {
    if (
      viewMode === "custom" &&
      pendingDateRange?.from &&
      pendingDateRange?.to
    ) {
      setCustomStartDate(format(pendingDateRange.from, "yyyy-MM-dd"));
      setCustomEndDate(format(pendingDateRange.to, "yyyy-MM-dd"));
    }
  }, [pendingDateRange, viewMode]);

  // When switching to custom, set pendingDateRange to current dateRange
  useEffect(() => {
    if (viewMode === "custom") {
      setPendingDateRange(dateRange);
      // setShowCalendar(true);
    } else {
      setShowCalendar(false);
    }
  }, [viewMode]);

  // Fetch all-time stats
  const fetchAllTimeStats = async (endDate: Date) => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/admin/reports/stats?endDate=${endDate.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await res.json();
      setStats((prev) => ({
        ...prev,
        totalProfit: data.totalProfit,
        totalExpenses: data.totalExpenses,
        totalInstallmetnsInterest: data.totalInstallmetnsInterest,
        totalIncome: data.totalIncome,
        totalPenaltyAmount: data.totalPenaltyAmount,
        openingBalance: data.openingBalance,
        totalCapital: data.totalCapital,
        totalLoanAmount: data.totalLoanAmount,
        totalActiveLoansAmount: data.totalActiveLoansAmount,
      }));
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch transactions for the selected date range
  const fetchTransactions = async (startDate: Date, endDate: Date) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/admin/reports/transactions?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await res.json();
      setStats((prev) => ({
        ...prev,
        transactions: data.transactions,
      }));

      // Calculate range stats
      const rangeStats = {
        profit:
          data.transactions
            .filter(
              (t: Transaction) =>
                (t.type === "INCOME" || t.type === "CAPITAL") &&
                t.category !== "NEUTRAL"
            )
            .reduce(
              (sum: number, t: Transaction) => sum + Math.abs(t.amount),
              0
            ) +
          data.transactions
            .filter(
              (t: Transaction) =>
                t.type === "INSTALLMENT" && t.category !== "NEUTRAL"
            )
            .reduce(
              (sum: number, t: Transaction) => sum + Math.abs(t.amount),
              0
            ) +
          data.transactions
            .filter(
              (t: Transaction) =>
                t.type === "INSTALLMENT" && t.category !== "NEUTRAL"
            )
            .reduce(
              (sum: number, t: Transaction) => sum + Math.abs(t.penaltyAmount),
              0
            ) -
          data.transactions
            .filter(
              (t: Transaction) =>
                t.type === "EXPENSE" && t.category !== "NEUTRAL"
            )
            .reduce(
              (sum: number, t: Transaction) => sum + Math.abs(t.amount),
              0
            ),
        expenses: data.transactions
          .filter(
            (t: Transaction) => t.type === "EXPENSE" && t.category !== "NEUTRAL"
          )
          .reduce((sum: number, t: Transaction) => sum + Math.abs(t.amount), 0),
        interest: data.transactions
          .filter(
            (t: Transaction) =>
              t.type === "INSTALLMENT" && t.category !== "NEUTRAL"
          )
          .reduce(
            (sum: number, t: Transaction) => sum + Math.abs(t.interest),
            0
          ),
        // Calculate income with installments included
        income:
          data.transactions
            .filter(
              (t: Transaction) =>
                (t.type === "INCOME" || t.type === "CAPITAL") &&
                t.category !== "NEUTRAL"
            )
            .reduce(
              (sum: number, t: Transaction) => sum + Math.abs(t.amount),
              0
            ) +
          data.transactions
            .filter(
              (t: Transaction) =>
                t.type === "INSTALLMENT" && t.category !== "NEUTRAL"
            )
            .reduce(
              (sum: number, t: Transaction) => sum + Math.abs(t.amount),
              0
            ),
        // Calculate penalty
        penalty: data.transactions
          .filter(
            (t: Transaction) =>
              t.type === "INSTALLMENT" && t.category !== "NEUTRAL"
          )
          .reduce(
            (sum: number, t: Transaction) => sum + Math.abs(t.penaltyAmount),
            0
          ),
      };
      setRangeStats(rangeStats);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchTransactions(dateRange.from, dateRange.to);
      fetchAllTimeStats(dateRange.to);
    }
  }, [dateRange]); // Fetch transactions when date range changes

  // Inline editing for notes
  const handleEdit = (id: string, currentNotes: string) => {
    setEditingId(id);
    setEditNotes(currentNotes || "");
  };
  const handleEditSave = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/transactions/${id}/notes`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: editNotes }),
      });

      if (!res.ok) {
        throw new Error("Failed to update notes");
      }

      // Update the transaction in the local state
      setStats((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t) =>
          t.id === id ? { ...t, notes: editNotes } : t
        ),
      }));

      setEditingId(null);
      setEditNotes("");
    } catch (error) {
      console.error("Error updating notes:", error);
      // You might want to show an error message to the user here
    }
  };
  const handleEditCancel = () => {
    setEditingId(null);
    setEditNotes("");
  };

  // Export to Excel
  const handleExport = async () => {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Finance Tracker";
    workbook.lastModifiedBy = "Finance Tracker";
    workbook.created = new Date();
    workbook.modified = new Date();

    // Add a worksheet for transactions
    const worksheet = workbook.addWorksheet("Transactions", {
      properties: { tabColor: { argb: "FF0000" } },
      pageSetup: { paperSize: 9, orientation: "landscape" },
    });

    // Set column widths
    worksheet.columns = [
      { key: "date", width: 15 },
      { key: "name", width: 20 },
      { key: "type", width: 15 },
      { key: "category", width: 15 },
      { key: "amount", width: 40 },
      { key: "interest", width: 20 },
      { key: "penalty", width: 20 },
      { key: "extra", width: 20 },
      { key: "notes", width: 40 },
    ];

    // Add title
    const titleRow = worksheet.addRow(["Transaction Report"]);
    titleRow.font = { size: 16, bold: true };
    worksheet.mergeCells("A1:I1");
    titleRow.alignment = { vertical: "middle", horizontal: "center" };

    // Add date range
    const dateRangeRow = worksheet.addRow([
      `Period: ${dateRange?.from ? format(dateRange.from, "PPP") : ""} ${
        dateRange?.to ? `to ${format(dateRange.to, "PPP")}` : ""
      }`,
    ]);
    dateRangeRow.font = { size: 12, italic: true };
    worksheet.mergeCells("A2:I2");
    dateRangeRow.alignment = { vertical: "middle", horizontal: "center" };

    // Add empty row
    worksheet.addRow([]);

    // Style the header row
    const headerRow = worksheet.getRow(4);
    headerRow.values = [
      "Date",
      "Name",
      "Type",
      "Category",
      "Amount (₹)",
      "Interest (₹)",
      "Penalty (₹)",
      "Extra (₹)",
      "Notes",
    ];
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F81BD" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Calculate totals
    let totalExpenses = 0;
    let totalIncome = 0;
    let totalInterest = 0;
    let totalPenalty = 0;
    let totalExtra = 0;
    let totalInstallmentAmount = 0;

    // Add data with alternating row colors
    stats.transactions.forEach((t, index) => {
      // Adjust amount based on transaction type
      let displayAmount = t.amount;
      if (t.type === "EXPENSE") {
        displayAmount = -Math.abs(t.amount);
        if (t.category !== "NEUTRAL") {
          totalExpenses += Math.abs(t.amount);
        }
      } else if (t.type === "INSTALLMENT") {
        displayAmount = Math.abs(t.amount);
        if (t.category !== "NEUTRAL") {
          totalInterest += t.interest;
          totalPenalty += t.penaltyAmount;
          totalExtra += t.extraAmount;
          totalInstallmentAmount += t.amount; // Include installment amount in income
        }
      } else if (t.type === "INCOME") {
        displayAmount = Math.abs(t.amount);
        if (t.category !== "NEUTRAL") {
          totalIncome += Math.abs(t.amount);
        }
      }

      const row = worksheet.addRow({
        date: format(new Date(t.createdAt), "yyyy-MM-dd"),
        name: t.name || "-",
        type: t.type,
        category: t.category,
        amount: displayAmount,
        interest: t.type === "INSTALLMENT" ? t.interest : "-",
        penalty: t.type === "INSTALLMENT" ? t.penaltyAmount : "-",
        extra: t.type === "INSTALLMENT" ? t.extraAmount : "-",
        notes: t.notes || "",
      });

      // Style the row
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { vertical: "middle" };
      });

      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF2F2F2" },
        };
      }

      // Color code amounts
      const amountCell = row.getCell("amount");
      amountCell.numFmt = '"₹"#,##0.00';
      amountCell.font = {
        color: { argb: displayAmount >= 0 ? "FF008000" : "FFFF0000" },
      };
    });

    const openingBalance = stats.openingBalance; // Add empty row
    const endDate = dateRange?.to || new Date();

    const closingBalance =
      format(endDate, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd")
        ? totalIncome + totalInstallmentAmount - totalExpenses
        : openingBalance + totalIncome + totalInstallmentAmount - totalExpenses;
    // Add summary details with proper formatting
    const summaryRows: [string, number][] = [
      ["Opening Balance", openingBalance],
      ["Installment Amount", totalInstallmentAmount],
      ["Interest Amount", totalInterest],
      ["Penalty Amount", totalPenalty],
      ["Extra Amount", totalExtra],
      ["Expenses", -totalExpenses],
      ["Total Income", totalIncome + totalInstallmentAmount + openingBalance],
      ["Closing Balance", closingBalance],
      // [
      //   "Total Incomming Amount",
      //   totalIncome + totalInstallmentAmount + totalPenalty + totalExtra,
      // ],
    ];

    // Add empty row before summary
    worksheet.addRow([]);

    // Add summary section with proper formatting
    summaryRows.forEach(([label, value]) => {
      const row = worksheet.addRow([label, "", "", "", value]);
      row.font = { bold: true };

      // Merge A-D for the label
      worksheet.mergeCells(`A${worksheet.rowCount}:D${worksheet.rowCount}`);

      // Format the value cell (column E)
      const valueCell = row.getCell(5);
      valueCell.numFmt = '"₹"#,##0.00';
      valueCell.font = {
        bold: true,
        color: { argb: value >= 0 ? "FF008000" : "FFFF0000" },
      };
      valueCell.alignment = { horizontal: "right" };

      // Add borders to the row
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Add empty row after summary
    worksheet.addRow([]);

    // Add footer with timestamp
    const footerRow = worksheet.addRow([
      `Generated on ${format(new Date(), "PPP p")}`,
    ]);
    footerRow.font = { italic: true, size: 10 };
    worksheet.mergeCells(`A${worksheet.rowCount}:I${worksheet.rowCount}`);
    footerRow.alignment = { vertical: "middle", horizontal: "center" };

    // Generate filename based on date range
    let filename = "transactions-";
    if (viewMode === "custom" && dateRange?.from && dateRange?.to) {
      filename += `${format(dateRange.from, "yyyy-MM-dd")}_to_${format(
        dateRange.to,
        "yyyy-MM-dd"
      )}`;
    } else if (viewMode === "yearly" && dateRange?.from) {
      filename += `${format(dateRange.from, "yyyy")}`;
    } else if (viewMode === "monthly" && dateRange?.from) {
      filename += `${format(dateRange.from, "yyyy-MM")}`;
    } else if (viewMode === "weekly" && dateRange?.from && dateRange?.to) {
      filename += `${format(dateRange.from, "yyyy-MM-dd")}_to_${format(
        dateRange.to,
        "yyyy-MM-dd"
      )}`;
    } else if (dateRange?.from) {
      filename += `${format(dateRange.from, "yyyy-MM-dd")}`;
    }
    filename += ".xlsx";

    // Save the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <ReportsSkeleton />;
  }

  return (
    <div className=" space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and view all reports in the system
          </p>
        </div>
        <Button
          onClick={handleExport}
          className="flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <Download className="mr-2 h-5 w-5" /> Export to Excel
        </Button>
      </div>

      {/* All Time Stats */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Time Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <dt className="truncate text-sm font-medium text-gray-500">
                All Time Capital
              </dt>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <div className="h-8 w-24 animate-pulse bg-gray-200 rounded" />
                ) : (
                  `₹${stats.totalCapital.toLocaleString()}`
                )}
              </div>
            </CardContent>
          </Card>
          {/* <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <dt className="truncate text-sm font-medium text-gray-500">
                All Time Income
              </dt>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <div className="h-8 w-24 animate-pulse bg-gray-200 rounded" />
                ) : (
                  `₹${stats.totalIncome.toLocaleString()}`
                )}
              </div>
            </CardContent>
          </Card> */}
          {/* <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <dt className="truncate text-sm font-medium text-gray-500">
                All Time Interest
              </dt>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <div className="h-8 w-24 animate-pulse bg-gray-200 rounded" />
                ) : (
                  `₹${stats.totalInstallmetnsInterest.toLocaleString()}`
                )}
              </div>
            </CardContent>
          </Card> */}
          <Card className="bg-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <dt className="truncate text-sm font-medium text-green-700">
                Current Loans Amount
              </dt>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <div className="h-8 w-24 animate-pulse bg-gray-100 rounded" />
                ) : (
                  `₹${stats.totalActiveLoansAmount.toLocaleString()}`
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <dt className="truncate text-sm font-medium text-yellow-700">
                All Loans Amount
              </dt>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <div className="h-8 w-24 animate-pulse bg-gray-200 rounded" />
                ) : (
                  `₹${stats.totalLoanAmount.toLocaleString()}`
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Range Stats */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {dateRange?.from &&
            dateRange?.to &&
            `Stats from ${format(dateRange.from, "PPP")} to ${format(
              dateRange.to,
              "PPP"
            )}` + ` (${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)})`}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <dt className="truncate text-sm font-medium text-gray-500">
                Opening Balance
              </dt>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-24 animate-pulse bg-gray-200 rounded" />
                ) : (
                  `₹${stats.openingBalance.toLocaleString()}`
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <dt className="truncate text-sm font-medium text-gray-500">
                Period Collection
              </dt>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-24 animate-pulse bg-gray-200 rounded" />
                ) : (
                  `₹${rangeStats.income.toLocaleString()}`
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <dt className="truncate text-sm font-medium text-gray-500">
                Period Interest
              </dt>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-24 animate-pulse bg-gray-200 rounded" />
                ) : (
                  `₹${rangeStats.interest.toLocaleString()}`
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <dt className="truncate text-sm font-medium text-gray-500">
                Period Penalty
              </dt>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-24 animate-pulse bg-gray-200 rounded" />
                ) : (
                  `₹${rangeStats.penalty.toLocaleString()}`
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <dt className="truncate text-sm font-medium text-gray-500">
                Period Expenses
              </dt>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <div className="h-8 w-24 animate-pulse bg-gray-200 rounded" />
                ) : (
                  `₹${rangeStats.expenses.toLocaleString()}`
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex flex-col  lg:flex-row gap-4 items-start bg-white p-4 rounded-lg">
        <div className="flex flex-col gap-2 w-full lg:w-auto relative">
          <div className="flex flex-row gap-2 items-end  ">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-600">Date Range</label>
              <Select
                value={viewMode}
                onValueChange={(val) => {
                  const newMode = val as typeof viewMode;
                  setViewMode(newMode);

                  if (newMode === "custom") {
                    // setShowCalendar(true);
                    return;
                  }

                  const newDateRange = getDateRangeForViewMode(newMode);
                  setDateRange(newDateRange);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent className="w-[150px]">
                  <SelectItem value="daily">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="weekly">Last 7 Days</SelectItem>
                  <SelectItem value="monthly">This Month</SelectItem>
                  <SelectItem value="yearly">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {viewMode === "custom" && (
              <div className="flex flex-row gap-4 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600">Start Date</label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => {
                      setCustomStartDate(e.target.value);
                      const start = parse(
                        e.target.value,
                        "yyyy-MM-dd",
                        new Date()
                      );
                      const newDateRange = {
                        from: startOfDay(start),
                        to: pendingDateRange?.to || endOfDay(new Date()),
                      };
                      setPendingDateRange(newDateRange);
                      setDateRange(newDateRange);
                    }}
                    className="w-[140px]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600">End Date</label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => {
                      setCustomEndDate(e.target.value);
                      const end = parse(
                        e.target.value,
                        "yyyy-MM-dd",
                        new Date()
                      );
                      const newDateRange = {
                        from: pendingDateRange?.from || startOfDay(new Date()),
                        to: endOfDay(end),
                      };
                      setPendingDateRange(newDateRange);
                      setDateRange(newDateRange);
                    }}
                    max={format(endOfDay(new Date()), "yyyy-MM-dd")}
                    className="w-[140px]"
                  />
                </div>
              </div>
            )}
          </div>
          {viewMode === "custom" && showCalendar && (
            <div className="absolute top-10 right-0 bg-white ml-0 lg:ml-8 mt-8 lg:mt-8 z-50 shadow-lg rounded-md">
              <Calendar
                mode="range"
                selected={pendingDateRange}
                onSelect={setPendingDateRange}
                className="rounded-md border shadow-lg"
                numberOfMonths={2}
              />
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                Amount
              </th>
              {stats.transactions.some((t) => t.type === "INSTALLMENT") && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Penalty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Extra
                  </th>
                </>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  Loading...
                </td>
              </tr>
            ) : stats.transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  No transactions found in the selected date range
                </td>
              </tr>
            ) : (
              stats.transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(transaction.createdAt), "yyyy-MM-dd")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.name || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.category}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-medium w-[200px] ${
                      transaction.type === "EXPENSE"
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {transaction.type === "EXPENSE" ? "-" : "+"}₹
                    {Math.abs(transaction.amount).toFixed(2)}
                  </td>
                  {stats.transactions.some((t) => t.type === "INSTALLMENT") && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.type === "INSTALLMENT"
                          ? `₹${transaction.interest.toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.type === "INSTALLMENT"
                          ? `₹${transaction.penaltyAmount.toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.type === "INSTALLMENT"
                          ? `₹${transaction.extraAmount.toFixed(2)}`
                          : "-"}
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === transaction.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          className="border rounded px-2 py-1 text-sm"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleEditSave(transaction.id)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleEditCancel}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <span>{transaction.notes || ""}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === transaction.id ? null : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleEdit(transaction.id, transaction.notes || "")
                        }
                      >
                        Edit
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {/* Summary row */}
          <tfoot>
            <tr className="bg-gray-100 text-sm font-semibold">
              <td className="px-6 py-3" colSpan={4}>
                Period Totals
              </td>
              <td
                className={`px-6 py-3 ${
                  rangeStats.profit >= 0 ? "text-green-600" : "text-red-600"
                }`}
                colSpan={1}
              >
                {rangeStats.profit >= 0 ? "+" : "-"}₹
                {Math.abs(rangeStats.profit).toFixed(2)}
              </td>
              {stats.transactions.some((t) => t.type === "INSTALLMENT") && (
                <>
                  <td className="px-6 py-3" colSpan={1}>
                    ₹
                    {stats.transactions
                      .filter((t) => t.type === "INSTALLMENT")
                      .reduce((sum, t) => sum + t.interest, 0)
                      .toFixed(2)}
                  </td>
                  <td className="px-6 py-3" colSpan={1}>
                    ₹
                    {stats.transactions
                      .filter((t) => t.type === "INSTALLMENT")
                      .reduce((sum, t) => sum + t.penaltyAmount, 0)
                      .toFixed(2)}
                  </td>
                  <td className="px-6 py-3" colSpan={1}>
                    ₹
                    {stats.transactions
                      .filter((t) => t.type === "INSTALLMENT")
                      .reduce((sum, t) => sum + t.extraAmount, 0)
                      .toFixed(2)}
                  </td>
                </>
              )}
              <td className="px-6 py-3" colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
