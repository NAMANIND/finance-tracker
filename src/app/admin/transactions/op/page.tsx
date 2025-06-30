"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

export default function TransactionOperationsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    transaction: Transaction | null;
  }>({ open: false, transaction: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/transactions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        toast.error("Failed to fetch transactions");
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setDeleteDialog({ open: true, transaction });
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

      // Remove the deleted transaction from the list
      setTransactions((prev) =>
        prev.filter((t) => t.id !== deleteDialog.transaction!.id)
      );

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

  if (loading) {
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
            Manage and delete transactions in the system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800">
            {transactions.length} Total Transactions
          </span>
        </div>
      </div>

      {/* Transactions List */}
      <Card className="overflow-hidden">
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
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(transaction)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No transactions found</div>
          </div>
        )}
      </Card>

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
