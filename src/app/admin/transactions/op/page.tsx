"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionsSkeleton } from "@/components/dashboard/TransactionsSkeleton";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  category: string;
  notes: string | null;
  name: string | null;
  addedBy: string | null;
  penaltyAmount: number;
  extraAmount: number;
  interest: number;
  createdAt: string;
  installmentId: string | null;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  limit: number;
}

interface TransactionsResponse {
  transactions: Transaction[];
  pagination: Pagination;
}

interface EditFormData {
  amount: number;
  type: string;
  category: string;
  notes: string;
  name: string;
  addedBy: string;
  penaltyAmount: number;
  extraAmount: number;
  interest: number;
  createdAt: string;
}

export default function TransactionOperationsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    limit: 10,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    transaction: Transaction | null;
  }>({ open: false, transaction: null });
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    transaction: Transaction | null;
  }>({ open: false, transaction: null });
  const [editForm, setEditForm] = useState<EditFormData>({
    amount: 0,
    type: "",
    category: "",
    notes: "",
    name: "",
    addedBy: "",
    penaltyAmount: 0,
    extraAmount: 0,
    interest: 0,
    createdAt: "",
  });
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const transactionTypes = [
    "EXPENSE",
    "INCOME",
    "INSTALLMENT",
    "CAPITAL",
    "OTHER",
  ];
  const transactionCategories = [
    "HOME",
    "CAR",
    "OFFICE",
    "EMI",
    "INTEREST",
    "FARM",
    "BHOPAL",
    "SAI_BABA",
    "PERSONAL",
    "INSTALLMENT",
    "INCOME",
    "LOAN",
    "NEUTRAL",
    "OTHER",
  ];

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch transactions when page or search changes
  useEffect(() => {
    fetchTransactions(pagination.currentPage, debouncedSearchTerm);
  }, [pagination.currentPage, debouncedSearchTerm]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) return; // Avoid unnecessary resets
    if (pagination.currentPage !== 1) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    } else {
      fetchTransactions(1, debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, searchTerm, pagination.currentPage]);

  const fetchTransactions = async (page: number = 1, search: string = "") => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      const response = await fetch(`/api/admin/transactions?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        toast.error("Failed to fetch transactions");
        throw new Error("Failed to fetch transactions");
      }

      const data: TransactionsResponse = await response.json();
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setDeleteDialog({ open: true, transaction });
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditForm({
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      notes: transaction.notes || "",
      name: transaction.name || "",
      addedBy: transaction.addedBy || "",
      penaltyAmount: transaction.penaltyAmount,
      extraAmount: transaction.extraAmount,
      interest: transaction.interest,
      createdAt: transaction.createdAt.split("T")[0],
    });
    setEditDialog({ open: true, transaction });
  };

  const handleEditFormChange = (
    field: keyof EditFormData,
    value: string | number
  ) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditConfirm = async () => {
    if (!editDialog.transaction) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/admin/transactions/${editDialog.transaction.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...editForm,
            createdAt: new Date(editForm.createdAt).toISOString(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update transaction");
      }

      const updatedTransaction = await response.json();
      toast.success("Transaction updated successfully");

      // Update the transaction in the list
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editDialog.transaction!.id ? updatedTransaction : t
        )
      );

      setEditDialog({ open: false, transaction: null });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update transaction";
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.transaction) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/admin/transactions/${deleteDialog.transaction.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete transaction");
      }

      toast.success("Transaction deleted successfully");

      // Refresh the current page
      await fetchTransactions(pagination.currentPage, debouncedSearchTerm);

      setDeleteDialog({ open: false, transaction: null });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete transaction";
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
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

  const getTransactionIcon = (type: string) => {
    if (type === "EXPENSE") {
      return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    } else if (type === "INCOME" || type === "INSTALLMENT") {
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    }
    return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "EXPENSE":
        return "text-red-600 bg-red-50";
      case "INCOME":
        return "text-green-600 bg-green-50";
      case "INSTALLMENT":
        return "text-blue-600 bg-blue-50";
      case "CAPITAL":
        return "text-purple-600 bg-purple-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading && transactions.length === 0) {
    return <TransactionsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Transaction Operations
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage, edit, and delete transactions in the system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800">
            {pagination.totalCount} Total Transactions
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search transactions by name, notes, type, category, amount, or added by..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-500">
            {loading
              ? "Searching..."
              : `Showing results for "${debouncedSearchTerm}"`}
          </div>
        )}
      </Card>

      {/* Transactions List */}
      <Card className="overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added By
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTransactionIcon(transaction.type)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.name || "N/A"}
                        </div>
                        {transaction.notes && (
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {transaction.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </div>
                    {(transaction.penaltyAmount > 0 ||
                      transaction.extraAmount > 0 ||
                      transaction.interest > 0) && (
                      <div className="text-xs text-gray-500">
                        {transaction.penaltyAmount > 0 &&
                          `Penalty: ${formatCurrency(
                            transaction.penaltyAmount
                          )}`}
                        {transaction.extraAmount > 0 &&
                          ` Extra: ${formatCurrency(transaction.extraAmount)}`}
                        {transaction.interest > 0 &&
                          ` Interest: ${formatCurrency(transaction.interest)}`}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                        transaction.type
                      )}`}
                    >
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(transaction.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.addedBy || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(transaction)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(transaction)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {debouncedSearchTerm
                ? `No transactions found for "${debouncedSearchTerm}"`
                : "No transactions found"}
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
                {Math.min(
                  pagination.currentPage * pagination.limit,
                  pagination.totalCount
                )}{" "}
                of {pagination.totalCount} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPreviousPage || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else {
                        const start = Math.max(1, pagination.currentPage - 2);
                        const end = Math.min(pagination.totalPages, start + 4);
                        pageNum = start + i;
                        if (pageNum > end) return null;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pageNum === pagination.currentPage
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          disabled={loading}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Transaction Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) =>
          setEditDialog({ open, transaction: editDialog.transaction })
        }
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update the transaction details below.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <Input
                  type="string"
                  value={editForm.amount}
                  onChange={(e) =>
                    handleEditFormChange(
                      "amount",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <Input
                  type="date"
                  value={editForm.createdAt}
                  onChange={(e) =>
                    handleEditFormChange("createdAt", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <Select
                  value={editForm.type}
                  onValueChange={(value) => handleEditFormChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) =>
                    handleEditFormChange("category", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <Input
                  value={editForm.name}
                  onChange={(e) => handleEditFormChange("name", e.target.value)}
                  placeholder="Transaction name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Added By
                </label>
                <Input
                  value={editForm.addedBy}
                  onChange={(e) =>
                    handleEditFormChange("addedBy", e.target.value)
                  }
                  placeholder="Added by"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Penalty Amount
                </label>
                <Input
                  type="string"
                  value={editForm.penaltyAmount}
                  onChange={(e) =>
                    handleEditFormChange(
                      "penaltyAmount",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Extra Amount
                </label>
                <Input
                  type="string"
                  value={editForm.extraAmount}
                  onChange={(e) =>
                    handleEditFormChange(
                      "extraAmount",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interest
                </label>
                <Input
                  type="string"
                  value={editForm.interest}
                  onChange={(e) =>
                    handleEditFormChange(
                      "interest",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => handleEditFormChange("notes", e.target.value)}
                rows={3}
                placeholder="Transaction notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialog({ open: false, transaction: null })}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button onClick={handleEditConfirm} disabled={updating}>
              {updating ? "Updating..." : "Update Transaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, transaction: deleteDialog.transaction })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action
              cannot be undone.
              {deleteDialog.transaction && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <div className="text-sm">
                    <strong>Amount:</strong>{" "}
                    {formatCurrency(deleteDialog.transaction.amount)}
                  </div>
                  <div className="text-sm">
                    <strong>Type:</strong> {deleteDialog.transaction.type}
                  </div>
                  <div className="text-sm">
                    <strong>Name:</strong>{" "}
                    {deleteDialog.transaction.name || "N/A"}
                  </div>
                  <div className="text-sm">
                    <strong>Date:</strong>{" "}
                    {formatDate(deleteDialog.transaction.createdAt)}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteDialog({ open: false, transaction: null })
              }
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
