"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Borrower {
  id: string;
  name: string;
  fatherName: string;
  phone: string;
}

export default function NewLoanPage() {
  const router = useRouter();
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    borrowerId: "",
    principalAmount: "",
    interestRate: "",
    repaymentFrequency: "MONTHLY",
    startDate: new Date().toISOString().split("T")[0],
  });
  const [formError, setFormError] = useState("");
  const [installmentDetails, setInstallmentDetails] = useState<{
    totalAmount: number;
    totalInterest: number;
    installments: {
      dueDate: string;
      amount: number;
      principal: number;
      interest: number;
    }[];
  } | null>(null);

  useEffect(() => {
    fetchBorrowers();
  }, []);

  const fetchBorrowers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/borrowers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch borrowers");
      }

      const data = await res.json();
      setBorrowers(data);
    } catch (error) {
      console.error("Error fetching borrowers:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateInstallments = useCallback(() => {
    const principal = parseFloat(formData.principalAmount);
    const rate = parseFloat(formData.interestRate) / 100;
    const frequency = formData.repaymentFrequency;
    const startDate = new Date(formData.startDate);

    if (isNaN(principal) || isNaN(rate) || principal <= 0 || rate <= 0) {
      return;
    }

    // Calculate total interest and amount
    const totalInterest = principal * rate;
    const totalAmount = principal + totalInterest;

    // Calculate number of installments based on frequency
    const numInstallments = frequency === "MONTHLY" ? 12 : 52;
    const installmentAmount = totalAmount / numInstallments;
    const principalPerInstallment = principal / numInstallments;
    const interestPerInstallment = totalInterest / numInstallments;

    // Generate installment schedule
    const installments = Array.from({ length: numInstallments }, (_, i) => {
      const dueDate = new Date(startDate);
      if (frequency === "MONTHLY") {
        dueDate.setMonth(dueDate.getMonth() + i + 1);
      } else {
        dueDate.setDate(dueDate.getDate() + (i + 1) * 7);
      }

      return {
        dueDate: dueDate.toISOString().split("T")[0],
        amount: installmentAmount,
        principal: principalPerInstallment,
        interest: interestPerInstallment,
      };
    });

    setInstallmentDetails({
      totalAmount,
      totalInterest,
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
      const res = await fetch("/api/admin/loans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          principalAmount: parseFloat(formData.principalAmount),
          interestRate: parseFloat(formData.interestRate),
          installments: installmentDetails.installments,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create loan");
      }

      router.push("/admin/loans");
    } catch (error) {
      console.error("Error creating loan:", error);
      setFormError(
        error instanceof Error ? error.message : "Failed to create loan"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Create New Loan
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Enter the loan details and calculate the installment schedule.
            </p>
          </div>
        </div>
        <div className="mt-5 md:col-span-2 md:mt-0">
          <form onSubmit={handleSubmit}>
            <div className="overflow-hidden shadow sm:rounded-md">
              <div className="bg-white px-4 py-5 sm:p-6">
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="borrowerId"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Borrower
                    </label>
                    <Select
                      value={formData.borrowerId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, borrowerId: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a borrower" />
                      </SelectTrigger>
                      <SelectContent>
                        {borrowers.map((borrower) => (
                          <SelectItem key={borrower.id} value={borrower.id}>
                            {borrower.name} ({borrower.phone})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="principalAmount"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Principal Amount
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <Input
                        type="number"
                        name="principalAmount"
                        id="principalAmount"
                        value={formData.principalAmount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            principalAmount: e.target.value,
                          })
                        }
                        className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="0.00"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="interestRate"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Interest Rate (%)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <Input
                        type="number"
                        name="interestRate"
                        id="interestRate"
                        value={formData.interestRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            interestRate: e.target.value,
                          })
                        }
                        className="block w-full rounded-md border-gray-300 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="0.00"
                        required
                        min="0"
                        step="0.01"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 sm:text-sm">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="repaymentFrequency"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Repayment Frequency
                    </label>
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
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Start Date
                    </label>
                    <Input
                      type="date"
                      name="startDate"
                      id="startDate"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          startDate: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>

                {formError && (
                  <div className="mt-4 text-red-500 text-sm">{formError}</div>
                )}

                {installmentDetails && (
                  <div className="mt-8">
                    <h4 className="text-lg font-medium text-gray-900">
                      Loan Summary
                    </h4>
                    <dl className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
                      <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                        <dt className="truncate text-sm font-medium text-gray-500">
                          Total Amount
                        </dt>
                        <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                          ₹{installmentDetails.totalAmount.toFixed(2)}
                        </dd>
                      </div>
                      <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                        <dt className="truncate text-sm font-medium text-gray-500">
                          Total Interest
                        </dt>
                        <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                          ₹{installmentDetails.totalInterest.toFixed(2)}
                        </dd>
                      </div>
                      <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                        <dt className="truncate text-sm font-medium text-gray-500">
                          Number of Installments
                        </dt>
                        <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                          {installmentDetails.installments.length}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-8">
                      <h4 className="text-lg font-medium text-gray-900">
                        Installment Schedule
                      </h4>
                      <div className="mt-4 flow-root">
                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="min-w-full divide-y divide-gray-300">
                              <thead>
                                <tr>
                                  <th
                                    scope="col"
                                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                                  >
                                    Due Date
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                  >
                                    Amount
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                  >
                                    Principal
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                                  >
                                    Interest
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {installmentDetails.installments.map(
                                  (installment, index) => (
                                    <tr key={index}>
                                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                        {installment.dueDate}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        ₹{installment.amount.toFixed(2)}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        ₹{installment.principal.toFixed(2)}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        ₹{installment.interest.toFixed(2)}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="mr-3 inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Create Loan
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
