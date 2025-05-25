"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Loan {
  id: string;
  principalAmount: number;
  interestRate: number;
  duration: number;
  startDate: string;
  status: string;
  totalAmount: number;
  remainingAmount: number;
  nextInstallmentDate: string | null;
  nextInstallmentAmount: number | null;
  installments: {
    id: string;
    dueDate: string;
    amount: number;
    principal: number;
    interest: number;
    installmentAmount: number;
    status: string;
  }[];
}

interface Borrower {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalLoans: number;
  activeLoans: number;
  totalAmount: number;
  lastPaymentDate: string | null;
  loans: Loan[];
}

export default function BorrowerDetails() {
  const params = useParams();
  const [borrower, setBorrower] = useState<Borrower | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBorrower = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/agent/borrowers/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch borrower");
        }

        const data = await res.json();
        setBorrower(data);
      } catch (error) {
        console.error("Error fetching borrower:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBorrower();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">
            Loading borrower details...
          </div>
        </div>
      </div>
    );
  }

  if (!borrower) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Borrower not found</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            {borrower.name}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Borrower details and loan history
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href={`/agent/borrowers/${borrower.id}/loans/new`}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add Loan
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Total Loans
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {borrower.totalLoans}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Active Loans
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {borrower.activeLoans}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Total Amount
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            ₹{borrower.totalAmount.toLocaleString()}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Last Payment
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {borrower.lastPaymentDate
              ? new Date(borrower.lastPaymentDate).toLocaleDateString()
              : "Never"}
          </dd>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">
          Contact Information
        </h2>
        <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Phone</dt>
            <dd className="mt-1 text-sm text-gray-900">{borrower.phone}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Address</dt>
            <dd className="mt-1 text-sm text-gray-900">{borrower.address}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Loans</h2>
        <div className="mt-4 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        Start Date
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
                        Interest Rate
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Duration
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Next Payment
                      </th>
                      <th
                        scope="col"
                        className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                      >
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {borrower.loans.map((loan) => (
                      <tr key={loan.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {new Date(loan.startDate).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ₹{loan.principalAmount.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {loan.interestRate}%
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {loan.duration} months
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {loan.status}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {loan.nextInstallmentDate
                            ? `${new Date(
                                loan.nextInstallmentDate
                              ).toLocaleDateString()} (₹${loan.nextInstallmentAmount?.toLocaleString()})`
                            : "No pending payments"}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            href={`/agent/borrowers/${borrower.id}/loans/${loan.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Details
                          </Link>
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
  );
}
