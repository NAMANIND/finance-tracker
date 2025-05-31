"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface AgentStats {
  totalBorrowers: number;
  totalActiveLoans: number;
  totalCollectedThisMonth: number;
  totalProfit: number;
  totalDueAmount: number;
  totalDueCount: number;
  duesToday: {
    borrower: {
      name: string;
      phone: string;
    };
    amount: number;
    dueDate: string;
    loanId: string;
    installmentId: string;
    principal: number;
    interest: number;
  }[];
  pendingsToday: {
    borrower: {
      name: string;
      phone: string;
    };
    amount: number;
    dueDate: string;
    loanId: string;
    installmentId: string;
    principal: number;
    interest: number;
  }[];
}

interface Borrower {
  id: string;
  name: string;
  phone: string;
  activeLoans: number;
}

interface CollectionFormData {
  dueAmount: number;
  amount: number;
  penaltyAmount: number;
  extraAmount: number;
  notes: string;
  installmentId: string;
  installmentAmount: string;
  interest: number;
}

export default function AgentDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "collections" | "clients" | "dues"
  >("collections");
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [formData, setFormData] = useState<CollectionFormData>({
    dueAmount: 0,
    amount: 0,
    penaltyAmount: 0,
    extraAmount: 0,
    notes: "",
    installmentId: "",
    installmentAmount: "",
    interest: 0,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["agentStats"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const statsRes = await fetch("/api/agent/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!statsRes.ok) {
        throw new Error("Failed to fetch stats");
      }

      return statsRes.json();
    },
  });

  const { data: borrowers, isLoading: borrowersLoading } = useQuery({
    queryKey: ["agentBorrowers"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const borrowersRes = await fetch("/api/agent/borrowers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!borrowersRes.ok) {
        throw new Error("Failed to fetch borrowers");
      }

      return borrowersRes.json();
    },
    enabled: activeTab === "clients",
  });

  const loading = statsLoading || (activeTab === "clients" && borrowersLoading);

  const handleCollectClick = (due: AgentStats["duesToday"][0]) => {
    setFormData({
      dueAmount: 0,
      amount: due.amount,
      penaltyAmount: 0,
      extraAmount: 0,
      notes: "",
      installmentId: due.installmentId,
      installmentAmount: due.amount.toString(),
      interest: due.interest,
    });
    setShowCollectionDialog(true);
  };

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
      if (name === "amount") {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/agent/collect/${formData.installmentId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(formData.amount),
          penaltyAmount: Number(formData.penaltyAmount) || 0,
          extraAmount: Number(formData.extraAmount) || 0,
          dueAmount: Number(formData.dueAmount) || 0,
          interest: Number(formData.interest) || 0,
          notes: formData.notes,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to collect payment");
      }

      setShowCollectionDialog(false);
      // refetch stats
      await queryClient.invalidateQueries({ queryKey: ["agentStats"] });
      await queryClient.invalidateQueries({ queryKey: ["agentBorrowers"] });
    } catch (error) {
      console.error("Error collecting payment:", error);
      // alert("Failed to collect payment");
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
    <div className="px-4 sm:px-6 lg:px-8">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
        Agent Dashboard
      </h1>

      <div className="mt-6 flex flex-row gap-5">
        {/* Total Borrowers */}
        <div className="flex-1 overflow-hidden rounded-lg bg-white px-4 py-4 sm:py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Assigned Clients
          </dt>
          <dd className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
            {stats?.totalBorrowers}
          </dd>
        </div>

        {/* Active Loans */}
        <div className="flex-1 overflow-hidden rounded-lg bg-white px-4 py-4 sm:py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Active Loans
          </dt>
          <dd className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
            {stats?.totalActiveLoans}
          </dd>
        </div>

        {/* Total Due Amount */}
        <div className="flex-1 overflow-hidden rounded-lg bg-white px-4 py-4 sm:py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Total Due Amount
          </dt>
          <dd className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
            ₹{stats?.totalDueAmount?.toLocaleString()}
          </dd>
        </div>

        {/* Total Due Count */}
        <div className="flex-1 overflow-hidden rounded-lg bg-white px-4 py-4 sm:py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Total Due Count
          </dt>
          <dd className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
            {stats?.totalDueCount}
          </dd>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 sm:mt-8 border-b border-gray-200">
        <nav
          className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto pb-2"
          aria-label="Tabs"
        >
          <button
            onClick={() => setActiveTab("collections")}
            className={`whitespace-nowrap border-b-2 py-3 sm:py-4 px-1 text-sm font-medium ${
              activeTab === "collections"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Today&apos;s Collections
            <span className="ml-1 inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
              {stats?.pendingsToday.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("dues")}
            className={`whitespace-nowrap border-b-2 py-3 sm:py-4 px-1 text-sm font-medium ${
              activeTab === "dues"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            All Dues
            <span className="ml-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
              {stats?.duesToday.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("clients")}
            className={`whitespace-nowrap border-b-2 py-3 sm:py-4 px-1 text-sm font-medium ${
              activeTab === "clients"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Assigned Clients
            <span className="ml-1 inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
              {borrowers?.length || 0}
            </span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "collections" ? (
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <ul role="list" className="divide-y divide-gray-200">
              {stats?.pendingsToday.map(
                (due: AgentStats["pendingsToday"][0]) => (
                  <li key={due.installmentId} className="px-4 sm:px-6 py-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                            <span className="text-lg font-medium text-indigo-600">
                              {due.borrower.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-base font-medium text-gray-900">
                              {due.borrower.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {due.borrower.phone}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            ₹{due.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">Due Today</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end border-t border-gray-100 pt-3">
                        <button
                          onClick={() => handleCollectClick(due)}
                          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500  focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                          Collect Payment of {due.borrower.name}
                        </button>
                      </div>
                    </div>
                  </li>
                )
              )}
              {stats?.duesToday.length === 0 && (
                <li className="px-4 sm:px-6 py-8 text-center text-sm text-gray-500">
                  No collections due today
                </li>
              )}
            </ul>
          </div>
        ) : activeTab === "dues" ? (
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <ul role="list" className="divide-y divide-gray-200">
              {stats?.duesToday.map((due: AgentStats["duesToday"][0]) => (
                <li key={due.installmentId} className="px-4 sm:px-6 py-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                          <span className="text-lg font-medium text-indigo-600">
                            {due.borrower.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-base font-medium text-gray-900">
                            {due.borrower.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {due.borrower.phone}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          ₹{due.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Due on {new Date(due.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        {Math.ceil(
                          (new Date().getTime() -
                            new Date(due.dueDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        days late
                      </span>
                      <button
                        onClick={() => handleCollectClick(due)}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        Collect Payment for {due.borrower.name}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
              {stats?.duesToday.length === 0 && (
                <li className="px-4 sm:px-6 py-8 text-center text-sm text-gray-500">
                  No dues found
                </li>
              )}
            </ul>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <ul role="list" className="divide-y divide-gray-200">
              {borrowers?.map((borrower: Borrower) => (
                <li key={borrower.id} className="px-4 sm:px-6 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {borrower.name}
                      </p>
                      <p className="text-sm text-gray-500">{borrower.phone}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {borrower.activeLoans} Active Loans
                    </p>
                  </div>
                </li>
              ))}
              {borrowers?.length === 0 && (
                <li className="px-4 sm:px-6 py-8 text-center text-sm text-gray-500">
                  No clients assigned
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Collection Dialog */}
      <Dialog
        open={showCollectionDialog}
        onOpenChange={setShowCollectionDialog}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Collect Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                value={formData.amount || ""}
                onChange={handleInputChange}
                required
                min="0"
                max={formData.installmentAmount}
                step="0.01"
                placeholder="Enter payment amount"
                className="mt-1"
              />
              <p className="mt-1 text-sm text-gray-500">
                Due Amount: ₹{Number(formData.dueAmount).toLocaleString()}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-2">
              <div className="w-full sm:w-1/2">
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
                  value={formData.penaltyAmount || ""}
                  onChange={handleInputChange}
                  placeholder="Enter penalty amount"
                  min="0"
                  step="0.01"
                  className="mt-1"
                />
              </div>

              <div className="w-full sm:w-1/2">
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
                  value={formData.extraAmount || ""}
                  onChange={handleInputChange}
                  placeholder="Enter extra amount"
                  min="0"
                  step="0.01"
                  className="mt-1"
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
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              className="w-full flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Collect Payment
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
