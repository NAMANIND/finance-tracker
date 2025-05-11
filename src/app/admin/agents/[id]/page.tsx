"use client";

import { Suspense, useEffect, useState } from "react";
import { notFound, useRouter, useParams } from "next/navigation";
import AgentDetails from "./AgentDetails";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentWithDetails } from "./types";
import {
  MagnifyingGlassIcon,
  PlusCircleIcon,
  UserIcon,
  PhoneIcon,
  IdentificationIcon,
  UserGroupIcon,
  CreditCardIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface Borrower {
  id: string;
  name: string;
  fatherName: string;
  phone: string;
  address: string;
  panId: string;
  isActive: boolean;
  loans: {
    id: string;
    status: string;
    principalAmount: number;
  }[];
  agentId: string | null;
}

export default function AgentPage() {
  const router = useRouter();
  const params = useParams();
  const [agent, setAgent] = useState<AgentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState("");
  const agentId = params.id as string;

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/admin/agents/${agentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 404) {
            notFound();
          }
          throw new Error("Failed to fetch agent");
        }

        const data = await res.json();
        setAgent(data);
      } catch (error) {
        console.error("Error fetching agent:", error);
      } finally {
        setLoading(false);
      }
    };

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
      }
    };

    fetchAgent();
    fetchBorrowers();
  }, [agentId]);

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

      // Update the local state to reflect the change
      setBorrowers(
        borrowers.map((borrower) =>
          borrower.id === borrowerId ? { ...borrower, agentId } : borrower
        )
      );
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

  if (!agent) {
    return notFound();
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Agent Details</h1>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="bg-white">
          <TabsTrigger value="details" className="text-gray-700">
            Details
          </TabsTrigger>
          <TabsTrigger value="borrowers" className="text-gray-700">
            Borrowers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Agent Information</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-700">
              <Suspense
                fallback={
                  <div className="text-gray-500">Loading agent details...</div>
                }
              >
                <AgentDetails agent={agent} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="borrowers">
          <Card className="bg-white">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-gray-900">Borrowers</CardTitle>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  <PlusCircleIcon className="mr-2 h-5 w-5" />
                  Add Borrower
                </button>
              </div>
            </CardHeader>
            <CardContent className="text-gray-700">
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
                          Active Loans
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                        >
                          Total Amount
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
                      {borrowers.filter((b) => b.agentId === agentId).length ===
                      0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <UserIcon className="h-12 w-12 text-gray-400" />
                              <h3 className="mt-2 text-sm font-medium text-gray-900">
                                No borrowers found
                              </h3>
                              <p className="mt-1 text-sm text-gray-500">
                                Get started by adding a new borrower
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        borrowers
                          .filter((b) => b.agentId === agentId)
                          .map((borrower) => (
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
                                <div className="flex items-center text-sm text-gray-900">
                                  <CreditCardIcon className="mr-2 h-4 w-4 text-gray-400" />
                                  {borrower.loans?.filter(
                                    (loan) => loan.status === "ACTIVE"
                                  ).length || 0}{" "}
                                  active
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  ₹
                                  {borrower.loans
                                    .reduce(
                                      (acc, loan) => acc + loan.principalAmount,
                                      0
                                    )
                                    .toLocaleString()}
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
                                  onClick={() =>
                                    router.push(
                                      `/admin/borrowers/${borrower.id}`
                                    )
                                  }
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  View details
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Borrower Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:h-screen sm:align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Add Borrower to Agent
                  </h3>
                  <div className="mt-4">
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
                      <div className="mt-4 rounded-md bg-red-50 p-4">
                        <div className="text-sm text-red-700">{error}</div>
                      </div>
                    )}

                    <div className="mt-4 max-h-96 overflow-y-auto">
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
                            <th scope="col" className="relative px-6 py-3">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {filteredBorrowers
                            .filter((b) => b.agentId !== agentId)
                            .map((borrower) => (
                              <tr
                                key={borrower.id}
                                className="hover:bg-gray-50"
                              >
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
                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                  <button
                                    onClick={() =>
                                      handleAssignBorrower(borrower.id)
                                    }
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    Assign
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
