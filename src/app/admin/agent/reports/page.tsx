"use client";

import { useState, useEffect } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parse, startOfDay, endOfDay, format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Users, Wallet, AlertCircle, Clock } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentReportsSkeleton } from "@/components/dashboard/AgentReportsSkeleton";

interface Installment {
  id: string;
  amount: number;
  status: string;
  dueDate: string;
  borrowerName: string;
  borrowerPhone: string;
  loanId: string;
  paidAt: string | null;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalLoans: number;
  activeLoans: number;
  totalBorrowers: number;
  totalAmount: number;
  collections: {
    target: number;
    collected: number;
    pending: number;
    overdue: number;
  };
  todayInstallments: Installment[];
}

type ViewMode =
  | "daily"
  | "yesterday"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom";

export default function AgentReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(
    null
  );

  useEffect(() => {
    const agentId = searchParams.get("agentId");
    if (agentId) {
      const agent = agents.find((a) => a.id === agentId);
      if (agent) {
        setSelectedAgent(agent);
      }
    }
  }, [searchParams, agents]);

  useEffect(() => {
    if (viewMode !== "custom") {
      const range = getDateRangeForViewMode(viewMode);
      if (range) {
        setDateRange(range);
        setCustomStartDate(format(range.from, "yyyy-MM-dd"));
        setCustomEndDate(format(range.to, "yyyy-MM-dd"));
        fetchAgents();
      }
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode !== "custom") {
      fetchAgents();
    }
  }, [viewMode]);

  const fetchAgents = async () => {
    try {
      let url = "/api/admin/agents/reports";

      if (viewMode === "custom" && customStartDate && customEndDate) {
        url += `?startDate=${customStartDate}&endDate=${customEndDate}`;
      } else if (viewMode !== "custom") {
        const dateRange = getDateRangeForViewMode(viewMode);
        if (dateRange) {
          url += `?startDate=${format(
            dateRange.from,
            "yyyy-MM-dd"
          )}&endDate=${format(dateRange.to, "yyyy-MM-dd")}`;
        }
      }

      const response = await fetch(url);
      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    router.push(`/admin/agent/reports?agentId=${agent.id}`);
  };

  const getDateRangeForViewMode = (mode: ViewMode) => {
    const today = new Date();
    switch (mode) {
      case "daily":
        return {
          from: startOfDay(today),
          to: endOfDay(today),
        };
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          from: startOfDay(yesterday),
          to: endOfDay(yesterday),
        };
      case "weekly":
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        return {
          from: startOfDay(lastWeek),
          to: endOfDay(today),
        };
      case "monthly":
        const firstDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );
        return {
          from: startOfDay(firstDayOfMonth),
          to: endOfDay(today),
        };
      case "yearly":
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
        return {
          from: startOfDay(firstDayOfYear),
          to: endOfDay(today),
        };
      default:
        return undefined;
    }
  };

  if (loading) {
    return <AgentReportsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and view all reports in the system for agents and their
            performance.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium  text-gray-700">
              Date Range:
            </label>
            <Select
              value={viewMode}
              onValueChange={(val) => {
                const newMode = val as ViewMode;
                setViewMode(newMode);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="weekly">Last 7 Days</SelectItem>
                <SelectItem value="monthly">This Month</SelectItem>
                <SelectItem value="yearly">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {viewMode === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  if (e.target.value && customEndDate) {
                    const newDateRange = {
                      from: parse(e.target.value, "yyyy-MM-dd", new Date()),
                      to: parse(customEndDate, "yyyy-MM-dd", new Date()),
                    };
                    setDateRange(newDateRange);
                    fetchAgents();
                  }
                }}
                className="w-[140px]"
              />
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  if (customStartDate && e.target.value) {
                    const newDateRange = {
                      from: parse(customStartDate, "yyyy-MM-dd", new Date()),
                      to: parse(e.target.value, "yyyy-MM-dd", new Date()),
                    };
                    setDateRange(newDateRange);
                    fetchAgents();
                  }
                }}
                className="w-[140px]"
              />
            </div>
          )}
        </div>
        {dateRange && (
          <div className="text-sm text-gray-500">
            Showing data from {format(dateRange.from, "dd MMM yyyy")} to{" "}
            {format(dateRange.to, "dd MMM yyyy")}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Agent List */}
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium text-gray-900">
                      Agents
                    </h2>
                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                      {agents.length}
                    </span>
                  </div>
                  <ChevronDown className="h-5 w-5 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-6 pt-0">
                  <div className="space-y-4">
                    {agents.map((agent) => (
                      <div
                        key={agent.id}
                        className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors ${
                          selectedAgent?.id === agent.id
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => handleAgentSelect(agent)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                            <Users className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="flex flex-col">
                            <p className="text-base font-medium text-gray-900">
                              {agent.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {agent.phone}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Agent Report */}
        <div className="lg:col-span-2 space-y-8">
          {selectedAgent ? (
            <div className="rounded-lg bg-white shadow">
              <Tabs defaultValue="installments" className="w-full">
                <div className="border-b">
                  <div className="px-6">
                    <TabsList className="h-14 w-full justify-start bg-white space-x-8">
                      <TabsTrigger
                        value="installments"
                        className="relative px-1 text-sm font-medium data-[state=active]:text-indigo-600 data-[state=active]:shadow-none"
                      >
                        Installments
                        <div className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-indigo-600 scale-x-0 transition-transform data-[state=active]:scale-x-100" />
                      </TabsTrigger>
                      <TabsTrigger
                        value="overview"
                        className="relative px-1 text-sm font-medium data-[state=active]:text-indigo-600 data-[state=active]:shadow-none"
                      >
                        Overview
                        <div className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-indigo-600 scale-x-0 transition-transform data-[state=active]:scale-x-100" />
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>

                <TabsContent value="overview" className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Quick Stats */}
                    <div className="col-span-1 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                          <Users className="h-5 w-5 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Quick Stats
                        </h3>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-50 to-white rounded-lg p-4 border border-indigo-100">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Total Loans
                            </span>
                            <span className="text-sm font-medium text-indigo-600">
                              {selectedAgent.totalLoans}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Active Loans
                            </span>
                            <span className="text-sm font-medium text-indigo-600">
                              {selectedAgent.activeLoans}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Total Borrowers
                            </span>
                            <span className="text-sm font-medium text-indigo-600">
                              {selectedAgent.totalBorrowers}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Collection Stats */}
                    <div className="col-span-1 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                          <Wallet className="h-5 w-5 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Collection Stats
                        </h3>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-white rounded-lg p-4 border border-emerald-100">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Target
                            </span>
                            <span className="text-sm font-medium text-emerald-600">
                              {formatCurrency(selectedAgent.collections.target)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Collected
                            </span>
                            <span className="text-sm font-medium text-emerald-600">
                              {formatCurrency(
                                selectedAgent.collections.collected
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Pending
                            </span>
                            <span className="text-sm font-medium text-amber-600">
                              {formatCurrency(
                                selectedAgent.collections.pending
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="col-span-1 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Performance
                        </h3>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-4 border border-blue-100">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Collection Rate
                            </span>
                            <span className="text-sm font-medium text-blue-600">
                              {(
                                (selectedAgent.collections.collected /
                                  selectedAgent.collections.target) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Overdue Rate
                            </span>
                            <span className="text-sm font-medium text-red-600">
                              {(
                                (selectedAgent.collections.overdue /
                                  selectedAgent.collections.pending) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Active Rate
                            </span>
                            <span className="text-sm font-medium text-indigo-600">
                              {(
                                (selectedAgent.activeLoans /
                                  selectedAgent.totalLoans) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="installments" className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        Installments Status
                      </h3>
                      <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                        {selectedAgent.todayInstallments.length} installments
                      </span>
                    </div>
                    <div className="min-h-[400px] max-h-[400px] overflow-y-auto">
                      {selectedAgent.todayInstallments.length === 0 ? (
                        <p className="text-gray-500">
                          No installments due today.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {selectedAgent.todayInstallments.map(
                            (installment) => (
                              <div
                                key={installment.id}
                                className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                              >
                                <div className="flex items-center space-x-4">
                                  <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                      installment.status === "PAID"
                                        ? "bg-green-100"
                                        : installment.status === "OVERDUE"
                                        ? "bg-red-100"
                                        : "bg-yellow-100"
                                    }`}
                                  >
                                    {installment.status === "PAID" ? (
                                      <Wallet className="h-5 w-5 text-green-600" />
                                    ) : installment.status === "OVERDUE" ? (
                                      <AlertCircle className="h-5 w-5 text-red-600" />
                                    ) : (
                                      <Clock className="h-5 w-5 text-yellow-600" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {installment.borrowerName}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Due date:{" "}
                                      {formatDate(
                                        installment.dueDate,
                                        "dd MMM yyyy"
                                      )}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Paid on:{" "}
                                      {installment.paidAt
                                        ? formatDate(
                                            installment.paidAt,
                                            "dd MMM yyyy"
                                          )
                                        : "N/A"}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p
                                    className={`font-medium ${
                                      installment.status === "PAID"
                                        ? "text-green-600"
                                        : installment.status === "OVERDUE"
                                        ? "text-red-600"
                                        : "text-yellow-600"
                                    }`}
                                  >
                                    {formatCurrency(installment.amount)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {installment.status}
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
              <p className="text-gray-500">
                Select an agent to view their report
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
