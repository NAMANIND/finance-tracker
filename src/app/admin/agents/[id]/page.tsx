"use client";

import { useEffect, useState } from "react";
import { notFound, useRouter, useParams } from "next/navigation";

import { AgentWithDetails } from "./types";
import {
  MagnifyingGlassIcon,
  PlusCircleIcon,
  UserIcon,
  PhoneIcon,
  UserGroupIcon,
  CreditCardIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";

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
  const params = useParams<{ id: string }>();
  const [agent, setAgent] = useState<AgentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddBorrowerModal, setShowAddBorrowerModal] = useState(false);
  const [selectedBorrowers, setSelectedBorrowers] = useState<Borrower[]>([]);
  const [availableBorrowers, setAvailableBorrowers] = useState<Borrower[]>([]);
  const [borrowerSearchTerm, setBorrowerSearchTerm] = useState("");

  useEffect(() => {
    const fetchAgentDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/admin/agents/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch agent details");
        }

        const data = await res.json();
        setAgent(data);
      } catch (error) {
        console.error("Error fetching agent details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAgentDetails();
    }
  }, [params.id]);

  useEffect(() => {
    const fetchAvailableBorrowers = async () => {
      if (!params.id) return;

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
        // Filter out borrowers that already have an agent or are already assigned to this agent
        const available = data.filter(
          (borrower: Borrower) =>
            !borrower.agentId ||
            (borrower.agentId && borrower.agentId !== params.id)
        );
        setAvailableBorrowers(available);
      } catch (error) {
        console.error("Error fetching available borrowers:", error);
      }
    };

    if (showAddBorrowerModal && params.id) {
      fetchAvailableBorrowers();
    }
  }, [showAddBorrowerModal, params.id]);

  const handleAddBorrowers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/agents/${params.id}/borrowers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          borrowerIds: selectedBorrowers.map((b) => b.id),
          agentId: params.id,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add borrowers");
      }

      // Refresh agent details
      const agentRes = await fetch(`/api/admin/agents/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!agentRes.ok) {
        throw new Error("Failed to fetch updated agent details");
      }

      const agentData = await agentRes.json();
      setAgent(agentData);
      setShowAddBorrowerModal(false);
      setSelectedBorrowers([]);
      setBorrowerSearchTerm("");
    } catch (error) {
      console.error("Error adding borrowers:", error);
      alert(error instanceof Error ? error.message : "Failed to add borrowers");
    }
  };

  const filteredBorrowers = agent?.borrowers.filter(
    (borrower) =>
      borrower.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrower.phone.includes(searchTerm) ||
      borrower.panId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading agent details...</div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return notFound();
  }

  return (
    <div className="space-y-6">
      {/* Agent Header */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
              <UserIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {agent.user.name}
              </h1>
              <p className="text-sm text-gray-500">ID: {agent.id}</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddBorrowerModal(true)}
            className="flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            <PlusCircleIcon className="mr-2 h-5 w-5" />
            Add Borrower
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("details")}
              className={`flex items-center border-b-2 px-4 py-4 text-sm font-medium ${
                activeTab === "details"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <UserIcon className="mr-2 h-5 w-5" />
              Agent Details
            </button>
            <button
              onClick={() => setActiveTab("borrowers")}
              className={`flex items-center border-b-2 px-4 py-4 text-sm font-medium ${
                activeTab === "borrowers"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <UserGroupIcon className="mr-2 h-5 w-5" />
              Borrowers
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "details" && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-500">
                  Personal Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-base font-medium text-gray-900">
                      {agent.user.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-base font-medium text-gray-900">
                      {agent.user.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID Proof</p>
                    <p className="text-base font-medium text-gray-900">
                      {agent.user.idProof}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-500">
                  Address
                </h3>
                <p className="text-base text-gray-900">{agent.user.address}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-500">
                  Commission Rate
                </h3>
                <p className="text-base font-medium text-gray-900">
                  {agent.commissionRate}%
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-500">
                  Performance Summary
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Total Borrowers</p>
                    <p className="text-base font-medium text-gray-900">
                      {agent.borrowers.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Loans</p>
                    <p className="text-base font-medium text-gray-900">
                      {agent.borrowers.reduce(
                        (acc, borrower) =>
                          acc +
                          borrower.loans.filter(
                            (loan) => loan.status === "ACTIVE"
                          ).length,
                        0
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "borrowers" && (
            <div>
              <div className="mb-4">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search borrowers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              {filteredBorrowers?.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-12 text-center">
                  <UserGroupIcon className="h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No borrowers found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm
                      ? "Try adjusting your search"
                      : "Get started by adding a new borrower"}
                  </p>
                  {!searchTerm && (
                    <div className="mt-6">
                      <button
                        onClick={() => setShowAddBorrowerModal(true)}
                        className="flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                      >
                        <PlusCircleIcon className="mr-2 h-5 w-5" />
                        Add Borrower
                      </button>
                    </div>
                  )}
                </div>
              ) : (
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
                        {filteredBorrowers?.map((borrower) => (
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
                                    {borrower.panId}
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
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="flex items-center text-sm text-gray-900">
                                <CreditCardIcon className="mr-2 h-4 w-4 text-gray-400" />
                                {borrower.loans.filter(
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
                                  borrower.loans.some(
                                    (loan) => loan.status === "ACTIVE"
                                  )
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {borrower.loans.some(
                                  (loan) => loan.status === "ACTIVE"
                                )
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                              <button
                                onClick={() =>
                                  router.push(`/admin/borrowers/${borrower.id}`)
                                }
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                View details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Borrower Modal */}
      {showAddBorrowerModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowAddBorrowerModal(false)}
            />

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                  onClick={() => setShowAddBorrowerModal(false)}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Add Borrowers
                  </h3>
                  <div className="mt-4">
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        type="text"
                        placeholder="Search borrowers..."
                        value={borrowerSearchTerm}
                        onChange={(e) => setBorrowerSearchTerm(e.target.value)}
                        className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>

                    <div className="mt-4 max-h-60 overflow-y-auto">
                      {availableBorrowers
                        .filter(
                          (borrower) =>
                            borrower.name
                              .toLowerCase()
                              .includes(borrowerSearchTerm.toLowerCase()) ||
                            borrower.phone.includes(borrowerSearchTerm) ||
                            borrower.panId
                              .toLowerCase()
                              .includes(borrowerSearchTerm.toLowerCase())
                        )
                        .map((borrower) => {
                          const isAlreadyAssigned = agent?.borrowers.some(
                            (b) => b.id === borrower.id
                          );
                          return (
                            <div
                              key={borrower.id}
                              className={`flex items-center justify-between border-b border-gray-200 py-2 ${
                                isAlreadyAssigned ? "opacity-50" : ""
                              }`}
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {borrower.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {borrower.phone}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  if (isAlreadyAssigned) return;
                                  if (
                                    selectedBorrowers.some(
                                      (b) => b.id === borrower.id
                                    )
                                  ) {
                                    setSelectedBorrowers(
                                      selectedBorrowers.filter(
                                        (b) => b.id !== borrower.id
                                      )
                                    );
                                  } else {
                                    setSelectedBorrowers([
                                      ...selectedBorrowers,
                                      borrower,
                                    ]);
                                  }
                                }}
                                disabled={isAlreadyAssigned}
                                className={`rounded-md px-3 py-1 text-sm font-medium ${
                                  isAlreadyAssigned
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : selectedBorrowers.some(
                                        (b) => b.id === borrower.id
                                      )
                                    ? "bg-indigo-100 text-indigo-700"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                {isAlreadyAssigned
                                  ? "Already Assigned"
                                  : selectedBorrowers.some(
                                      (b) => b.id === borrower.id
                                    )
                                  ? "Selected"
                                  : "Select"}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleAddBorrowers}
                  disabled={selectedBorrowers.length === 0}
                >
                  Add Selected
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setShowAddBorrowerModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
