"use client";

import { useEffect, useState } from "react";

interface AgentStats {
  totalBorrowers: number;
  totalActiveLoans: number;
  totalCollectedToday: number;
  totalCollectedThisMonth: number;
  totalProfit: number;
  duesToday: {
    borrower: {
      name: string;
      phone: string;
    };
    amount: number;
    dueDate: string;
    loanId: string;
    installmentId: string;
  }[];
}

export default function AgentDashboard() {
  const [stats, setStats] = useState<AgentStats>({
    totalBorrowers: 0,
    totalActiveLoans: 0,
    totalCollectedToday: 0,
    totalCollectedThisMonth: 0,
    totalProfit: 0,
    duesToday: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/agent/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch stats");
        }

        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleCollectPayment = async (installmentId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/agent/collect/${installmentId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to collect payment");
      }

      // Refresh stats
      window.location.reload();
    } catch (error) {
      console.error("Error collecting payment:", error);
      alert("Failed to collect payment");
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
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Agent Dashboard</h1>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Borrowers */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            My Borrowers
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {stats.totalBorrowers}
          </dd>
        </div>

        {/* Active Loans */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Active Loans
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {stats.totalActiveLoans}
          </dd>
        </div>

        {/* Collections Today */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Collected Today
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            ₹{stats.totalCollectedToday.toLocaleString()}
          </dd>
        </div>

        {/* Collections This Month */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Collected This Month
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            ₹{stats.totalCollectedThisMonth.toLocaleString()}
          </dd>
        </div>

        {/* Total Profit */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Total Profit
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            ₹{stats.totalProfit.toLocaleString()}
          </dd>
        </div>
      </div>

      {/* Collections Due Today */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">
          Collections Due Today
        </h2>
        <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
          <ul role="list" className="divide-y divide-gray-200">
            {stats.duesToday.map((due) => (
              <li
                key={due.installmentId}
                className="flex items-center justify-between gap-x-6 px-5 py-5"
              >
                <div className="min-w-0">
                  <div className="flex items-start gap-x-3">
                    <p className="text-sm font-semibold leading-6 text-gray-900">
                      {due.borrower.name}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                    <p className="truncate">Phone: {due.borrower.phone}</p>
                    <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                      <circle cx={1} cy={1} r={1} />
                    </svg>
                    <p className="whitespace-nowrap">
                      Due: ₹{due.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-none items-center gap-x-4">
                  <button
                    onClick={() => handleCollectPayment(due.installmentId)}
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Collect
                  </button>
                </div>
              </li>
            ))}
            {stats.duesToday.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-gray-500">
                No collections due today
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
