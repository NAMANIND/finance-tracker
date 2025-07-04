"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Trash2,
  Calendar,
  DollarSign,
  Edit,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

interface Installment {
  id: string;
  loanId: string;
  amount: number;
  principal: number;
  interest: number;
  installmentAmount: number;
  dueDate: string;
  status: "PENDING" | "PAID" | "OVERDUE" | "SKIPPED";
  penaltyAmount: number;
  extraAmount: number;
  dueAmount: number;
  paidAt: string | null;
  createdAt: string;
  borrowerName: string;
  borrowerPhone: string;
  agentName: string;
  frequency: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  limit: number;
}

interface InstallmentsResponse {
  installments: Installment[];
  pagination: Pagination;
}

interface EditFormData {
  amount: number;
  principal: number;
  interest: number;
  installmentAmount: number;
  dueDate: string;
  status: string;
  penaltyAmount: number;
  extraAmount: number;
  dueAmount: number;
  paidAt: string;
}

export default function InstallmentOperationsPage() {
  const [installments, setInstallments] = useState<Installment[]>([]);
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
    installment: Installment | null;
  }>({ open: false, installment: null });
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    installment: Installment | null;
  }>({ open: false, installment: null });
  const [editForm, setEditForm] = useState<EditFormData>({
    amount: 0,
    principal: 0,
    interest: 0,
    installmentAmount: 0,
    dueDate: "",
    status: "",
    penaltyAmount: 0,
    extraAmount: 0,
    dueAmount: 0,
    paidAt: "",
  });
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const installmentStatuses = ["PENDING", "PAID", "OVERDUE", "SKIPPED"];

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch installments when page or search changes
  useEffect(() => {
    fetchInstallments(pagination.currentPage, debouncedSearchTerm);
  }, [pagination.currentPage, debouncedSearchTerm]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) return; // Avoid unnecessary resets
    if (pagination.currentPage !== 1) {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    } else {
      fetchInstallments(1, debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, searchTerm, pagination.currentPage]);

  const fetchInstallments = async (page: number = 1, search: string = "") => {
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

      const response = await fetch(`/api/admin/installments?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        toast.error("Failed to fetch installments");
        throw new Error("Failed to fetch installments");
      }

      const data: InstallmentsResponse = await response.json();
      setInstallments(data.installments);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching installments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleDeleteClick = (installment: Installment) => {
    setDeleteDialog({ open: true, installment });
  };

  const handleEditClick = (installment: Installment) => {
    setEditForm({
      amount: installment.amount,
      principal: installment.principal,
      interest: installment.interest,
      installmentAmount: installment.installmentAmount,
      dueDate: installment.dueDate.split("T")[0],
      status: installment.status,
      penaltyAmount: installment.penaltyAmount,
      extraAmount: installment.extraAmount,
      dueAmount: installment.dueAmount,
      paidAt: installment.paidAt ? installment.paidAt.split("T")[0] : "",
    });
    setEditDialog({ open: true, installment });
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
    if (!editDialog.installment) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/admin/installments/${editDialog.installment.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...editForm,
            dueDate: new Date(editForm.dueDate).toISOString(),
            paidAt: editForm.paidAt
              ? new Date(editForm.paidAt).toISOString()
              : null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update installment");
      }

      const updatedInstallment = await response.json();
      toast.success("Installment updated successfully");

      // Update the installment in the list
      setInstallments((prev) =>
        prev.map((i) =>
          i.id === editDialog.installment!.id ? updatedInstallment : i
        )
      );

      setEditDialog({ open: false, installment: null });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update installment";
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.installment) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/admin/installments/${deleteDialog.installment.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete installment");
      }

      toast.success("Installment deleted successfully");

      // Refresh the current page
      await fetchInstallments(pagination.currentPage, debouncedSearchTerm);

      setDeleteDialog({ open: false, installment: null });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete installment";
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
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "text-green-600 bg-green-50";
      case "PENDING":
        return "text-yellow-600 bg-yellow-50";
      case "OVERDUE":
        return "text-red-600 bg-red-50";
      case "SKIPPED":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case "PENDING":
        return <Calendar className="h-4 w-4 text-yellow-500" />;
      case "OVERDUE":
        return <Calendar className="h-4 w-4 text-red-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading && installments.length === 0) {
    return <TransactionsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Installment Operations
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage, edit, and delete installments in the system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800">
            {pagination.totalCount} Total Installments
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search installments by borrower name, phone, or amount..."
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

      {/* Installments List */}
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
                  Borrower
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {installments.map((installment) => (
                <tr key={installment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {installment.borrowerName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {installment.borrowerPhone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      Total: {formatCurrency(installment.amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Principal: {formatCurrency(installment.principal)} |
                      Interest: {formatCurrency(installment.interest)}
                    </div>
                    {(installment.penaltyAmount > 0 ||
                      installment.extraAmount > 0) && (
                      <div className="text-xs text-gray-500">
                        {installment.penaltyAmount > 0 &&
                          `Penalty: ${formatCurrency(
                            installment.penaltyAmount
                          )}`}
                        {installment.extraAmount > 0 &&
                          ` Extra: ${formatCurrency(installment.extraAmount)}`}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(installment.status)}
                      <span
                        className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          installment.status
                        )}`}
                      >
                        {installment.status}
                      </span>
                    </div>
                    {installment.paidAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        Paid: {formatDate(installment.paidAt)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(installment.dueDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {installment.agentName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(installment)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(installment)}
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

        {installments.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {debouncedSearchTerm
                ? `No installments found for "${debouncedSearchTerm}"`
                : "No installments found"}
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

      {/* Edit Installment Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) =>
          setEditDialog({ open, installment: editDialog.installment })
        }
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Installment</DialogTitle>
            <DialogDescription>
              Update the installment details below.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <Input
                  type="number"
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
                  Principal
                </label>
                <Input
                  type="number"
                  value={editForm.principal}
                  onChange={(e) =>
                    handleEditFormChange(
                      "principal",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interest
                </label>
                <Input
                  type="number"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Installment Amount
                </label>
                <Input
                  type="number"
                  value={editForm.installmentAmount}
                  onChange={(e) =>
                    handleEditFormChange(
                      "installmentAmount",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) =>
                    handleEditFormChange("dueDate", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) =>
                    handleEditFormChange("status", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {installmentStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Penalty Amount
                </label>
                <Input
                  type="number"
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
                  type="number"
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
                  Due Amount
                </label>
                <Input
                  type="number"
                  value={editForm.dueAmount}
                  onChange={(e) =>
                    handleEditFormChange(
                      "dueAmount",
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
                Paid At (Optional)
              </label>
              <Input
                type="date"
                value={editForm.paidAt}
                onChange={(e) => handleEditFormChange("paidAt", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialog({ open: false, installment: null })}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button onClick={handleEditConfirm} disabled={updating}>
              {updating ? "Updating..." : "Update Installment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, installment: deleteDialog.installment })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Installment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this installment? This action
              cannot be undone.
              {deleteDialog.installment && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <div className="text-sm">
                    <strong>Borrower:</strong>{" "}
                    {deleteDialog.installment.borrowerName}
                  </div>
                  <div className="text-sm">
                    <strong>Amount:</strong>{" "}
                    {formatCurrency(deleteDialog.installment.amount)}
                  </div>
                  <div className="text-sm">
                    <strong>Status:</strong> {deleteDialog.installment.status}
                  </div>
                  <div className="text-sm">
                    <strong>Due Date:</strong>{" "}
                    {formatDate(deleteDialog.installment.dueDate)}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteDialog({ open: false, installment: null })
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
