"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== "AGENT") {
      router.push("/login");
      return;
    }

    setUser(userData);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 flex-col sm:flex-row sm:justify-between sm:h-16">
            <div className="flex items-center justify-between py-3 sm:py-0">
              <div className="flex flex-shrink-0 items-center">
                <span className="text-lg sm:text-xl font-bold text-indigo-600">
                  Agent Dashboard
                </span>
              </div>
              <div className="flex sm:hidden items-center space-x-4">
                <span className="text-sm text-gray-700">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-indigo-600 px-2 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Logout
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end py-2 sm:py-0">
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <div className="relative ml-3">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-700">
                      Welcome, {user.name}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
