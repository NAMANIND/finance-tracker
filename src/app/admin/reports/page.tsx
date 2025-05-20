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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import { addDays, format, startOfDay, endOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
// We'll import xlsx dynamically when needed

interface Transaction {
  id: string;
  amount: number;
  type: "EXPENSE" | "INSTALLMENT" | "OTHER";
  category: string;
  createdAt: string;
  notes?: string;
}

interface ReportStats {
  totalProfit: number;
  totalExpenses: number;
  totalInstallments: number;
  transactions: Transaction[];
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });
  const [viewMode, setViewMode] = useState<
    "daily" | "weekly" | "monthly" | "yearly" | "custom"
  >("daily");
  const [stats, setStats] = useState<ReportStats>({
    totalProfit: 0,
    totalExpenses: 0,
    totalInstallments: 0,
    transactions: [],
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<string>("");

  const fetchReportData = async (startDate: Date, endDate: Date) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/admin/reports?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch report data");
      }

      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchReportData(dateRange.from, dateRange.to);
    }
  }, [dateRange]);

  const handleViewModeChange = (value: string) => {
    setViewMode(value as typeof viewMode);
    // Update date range based on view mode
    const today = new Date();
    switch (value) {
      case "daily":
        setDateRange({
          from: startOfDay(today),
          to: endOfDay(today),
        });
        break;
      case "weekly":
        setDateRange({
          from: startOfDay(addDays(today, -7)),
          to: endOfDay(today),
        });
        break;
      case "monthly":
        setDateRange({
          from: startOfDay(new Date(today.getFullYear(), today.getMonth(), 1)),
          to: endOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
        });
        break;
      case "yearly":
        setDateRange({
          from: startOfDay(new Date(today.getFullYear(), 0, 1)),
          to: endOfDay(new Date(today.getFullYear(), 11, 31)),
        });
        break;
      default:
        break;
    }
  };

  // Inline editing for notes
  const handleEdit = (id: string, currentNotes: string) => {
    setEditingId(id);
    setEditNotes(currentNotes || "");
  };
  const handleEditSave = async (id: string) => {
    // TODO: Implement API call to update notes
    setEditingId(null);
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
      { header: "Date", key: "date", width: 15 },
      { header: "Type", key: "type", width: 15 },
      { header: "Category", key: "category", width: 15 },
      { header: "Amount (₹)", key: "amount", width: 20 },
      { header: "Notes", key: "notes", width: 40 },
    ];

    // Add title
    const titleRow = worksheet.addRow(["Transaction Report"]);
    titleRow.font = { size: 16, bold: true };
    worksheet.mergeCells("A1:E1");
    titleRow.alignment = { vertical: "middle", horizontal: "center" };

    // Add date range
    const dateRangeRow = worksheet.addRow([
      `Period: ${dateRange?.from ? format(dateRange.from, "PPP") : ""} ${
        dateRange?.to ? `to ${format(dateRange.to, "PPP")}` : ""
      }`,
    ]);
    dateRangeRow.font = { size: 12, italic: true };
    worksheet.mergeCells("A2:E2");
    dateRangeRow.alignment = { vertical: "middle", horizontal: "center" };

    // Add empty row
    worksheet.addRow([]);

    // Style the header row
    const headerRow = worksheet.getRow(4);
    headerRow.values = ["Date", "Type", "Category", "Amount (₹)", "Notes"];
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
    let totalInstallments = 0;
    let totalExpenses = 0;
    let totalOther = 0;

    // Add data with alternating row colors
    stats.transactions.forEach((t, index) => {
      const row = worksheet.addRow({
        date: format(new Date(t.createdAt), "yyyy-MM-dd"),
        type: t.type,
        category: t.category,
        amount: t.amount,
        notes: t.notes || "",
      });

      // Update totals based on transaction type
      if (t.type === "INSTALLMENT") {
        totalInstallments += t.amount;
      } else if (t.type === "EXPENSE") {
        totalExpenses += Math.abs(t.amount);
      } else if (t.type === "OTHER") {
        totalOther += t.amount;
      }

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
        color: { argb: t.amount >= 0 ? "FF008000" : "FFFF0000" },
      };
    });

    // Add empty row
    worksheet.addRow([]);

    // Add summary details with proper formatting
    const summaryRows: [string, number][] = [
      ["Total Installments", totalInstallments],
      ["Total Expenses", -totalExpenses], // Make expenses negative for display
      ["Total Other Income", totalOther],
      ["Net Profit", totalInstallments + totalOther - totalExpenses],
    ];

    // Add empty row before summary
    worksheet.addRow([]);

    // Add summary section with proper formatting
    summaryRows.forEach(([label, value]) => {
      // Place value in column E (5th cell)
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
    worksheet.mergeCells(`A${worksheet.rowCount}:E${worksheet.rowCount}`);
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

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Reports & Statistics
          </h1>
          <p className="text-muted-foreground">
            View your financial reports and statistics
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="ml-auto">
          Export to Excel
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.totalProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.totalExpenses.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Installments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.totalInstallments.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select value={viewMode} onValueChange={handleViewModeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select view mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {viewMode === "custom" && (
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              )}

              {dateRange?.from && (
                <div className="text-sm text-muted-foreground">
                  {format(dateRange.from, "PPP")}
                  {dateRange.to && ` - ${format(dateRange.to, "PPP")}`}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
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
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  Loading...
                </td>
              </tr>
            ) : stats.transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
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
                    {transaction.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.category}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      transaction.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.amount > 0 ? "+" : "-"}₹
                    {Math.abs(transaction.amount).toFixed(2)}
                  </td>
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
            <tr className="bg-gray-100 font-semibold">
              <td className="px-6 py-3" colSpan={3}>
                Totals
              </td>
              <td className="px-6 py-3 text-green-600">
                +₹{stats.totalInstallments.toFixed(2)}
              </td>
              <td className="px-6 py-3 text-red-600">
                -₹{stats.totalExpenses.toFixed(2)}
              </td>
              <td className="px-6 py-3 text-black">
                Profit: ₹{stats.totalProfit.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
