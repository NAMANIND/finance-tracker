import { Skeleton } from "@/components/ui/skeleton";

export function AgentReportsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-1 h-4 w-72" />
        </div>
      </div>

      {/* Date Range Selector Skeleton */}
      <div className="flex flex-col gap-4 bg-white p-4 h-[100px] rounded-lg shadow">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <Skeleton className="h-10 w-[500px]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Agent List Skeleton */}
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-6" />
              </div>
            </div>
            <div className="p-6 pt-0">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Agent Report Skeleton */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-lg bg-white shadow">
            <div className="border-b">
              <div className="px-2">
                <div className="flex space-x-8 p-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
            </div>
            <div className="p-6">
              {/* Installments Status  */}
              <div className="col-span-1 space-y-4">
                <div className="flex items-center gap-2 justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-32" />
                </div>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-lg p-4 border border-purple-100"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 justify-between">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-6 w-32" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Quick Stats Skeleton */}
                {/* <div className="col-span-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-white rounded-lg p-4 border border-indigo-100">
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center"
                        >
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div> */}

                {/* Collection Stats Skeleton */}
                {/* <div className="col-span-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-white rounded-lg p-4 border border-emerald-100">
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center"
                        >
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div> */}

                {/* Performance Metrics Skeleton */}
                {/* <div className="col-span-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-4 border border-blue-100">
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center"
                        >
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
