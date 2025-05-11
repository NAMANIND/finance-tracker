"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MagnifyingGlassIcon,
  UserIcon,
  PhoneIcon,
  IdentificationIcon,
} from "@heroicons/react/24/outline";

interface Borrower {
  id: string;
  name: string;
  fatherName: string;
  phone: string;
  panId: string;
  address: string;
  isActive: boolean;
}

export default function NewBorrowerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agentId");
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!agentId) {
      router.push("/admin/agents");
      return;
    }
    fetchBorrowers();
  }, [agentId, router]);

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
      setError("Failed to fetch borrowers");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignBorrower = async (borrowerId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/borrowers/${borrowerId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ agentId }),
      });

      if (!res.ok) {
        throw new Error("Failed to assign borrower");
      }

      router.push(`/admin/agents/${agentId}`);
    } catch (error) {
      console.error("Error assigning borrower:", error);
      setError("Failed to assign borrower");
    }
  };

  const filteredBorrowers = borrowers.filter(
    (borrower) =>
      borrower.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrower.phone.includes(searchTerm) ||
      borrower.panId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Add Borrower to Agent
        </h1>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search borrowers by name, phone, or PAN ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Borrower
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Contact
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredBorrowers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <UserIcon className="h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No borrowers found
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm
                          ? "Try adjusting your search"
                          : "No borrowers available"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBorrowers.map((borrower) => (
                  <tr key={borrower.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                          <UserIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {borrower.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {borrower.fatherName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center text-sm text-gray-900">
                          <PhoneIcon className="mr-2 h-4 w-4 text-gray-400" />
                          {borrower.phone}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <IdentificationIcon className="mr-2 h-4 w-4 text-gray-400" />
                          {borrower.panId}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          borrower.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {borrower.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleAssignBorrower(borrower.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Assign
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
