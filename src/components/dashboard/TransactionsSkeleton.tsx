export function TransactionsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-10 w-40 animate-pulse rounded bg-gray-200" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column - Today's Transactions */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-5 w-8 animate-pulse rounded-full bg-gray-200" />
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                  <div>
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-40 animate-pulse rounded bg-gray-200" />
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

        {/* Right Column - Add Transaction Form */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-6 h-6 w-40 animate-pulse rounded bg-gray-200" />

          {/* Tabs */}
          <div className="mb-6 grid w-full grid-cols-2 gap-2">
            <div className="h-10 animate-pulse rounded bg-gray-200" />
            <div className="h-10 animate-pulse rounded bg-gray-200" />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="mb-2 h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
              </div>
            ))}

            {/* Textarea */}
            <div>
              <div className="mb-2 h-4 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-24 w-full animate-pulse rounded bg-gray-200" />
            </div>

            {/* Submit Button */}
            <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
