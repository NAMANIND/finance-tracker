export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-10 w-40 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Stats Section Skeleton */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
          >
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Two Column Layout Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column Skeleton */}
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg bg-white shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
                  <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
              <div className="p-6 pt-0">
                <div className="space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                        <div>
                          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                          <div className="mt-2 h-3 w-24 animate-pulse rounded bg-gray-200" />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                        <div className="mt-2 h-3 w-16 animate-pulse rounded bg-gray-200" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column Skeleton */}
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg bg-white shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
                  <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
              <div className="p-6 pt-0">
                <div className="space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                        <div>
                          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                          <div className="mt-2 h-3 w-24 animate-pulse rounded bg-gray-200" />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                        <div className="mt-2 h-3 w-16 animate-pulse rounded bg-gray-200" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
