"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function NewLoan() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      principalAmount: Number(formData.get("principalAmount")),
      interestRate: Number(formData.get("interestRate")),
      duration: Number(formData.get("duration")),
      startDate: formData.get("startDate"),
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/agent/borrowers/${params.id}/loans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create loan");
      }

      router.push(`/agent/borrowers/${params.id}`);
    } catch (error) {
      console.error("Error creating loan:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create loan"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Add New Loan</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create a new loan for this borrower.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <label
              htmlFor="principalAmount"
              className="block text-sm font-medium text-gray-700"
            >
              Principal Amount (₹)
            </label>
            <div className="mt-1">
              <input
                type="number"
                name="principalAmount"
                id="principalAmount"
                required
                min="0"
                step="0.01"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
              <input
                type="number"
                name="interestRate"
                id="interestRate"
                required
                min="0"
                max="100"
                step="0.01"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="duration"
              className="block text-sm font-medium text-gray-700"
            >
              Duration (months)
            </label>
            <div className="mt-1">
              <input
                type="number"
                name="duration"
                id="duration"
                required
                min="1"
                max="60"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
              <input
                type="date"
                name="startDate"
                id="startDate"
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {loading ? "Creating..." : "Create Loan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
