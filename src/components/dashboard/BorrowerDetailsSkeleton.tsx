export function BorrowerDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Borrower Header */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200" />
            <div>
              <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
              <div className="mt-1 h-4 w-32 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
          <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="border-b border-gray-200">
          <div className="flex -mb-px">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center  px-4 py-4">
                <div className="mr-2 h-5 w-5 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Loan History Tab */}
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 overflow-hidden"
              >
                {/* Loan Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
                        <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
                      </div>
                      <div className="mt-1 h-4 w-40 animate-pulse rounded bg-gray-200" />
                    </div>
                    <div className="flex items-center">
                      <div className="text-right mr-4">
                        <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
                        <div className="mt-1 h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </div>
                      <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
                    </div>
                  </div>
                </div>

                {/* Loan Details */}
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  {/* Stats Grid */}
                  <div className="mb-6 grid grid-cols-4 gap-4">
                    {[...Array(4)].map((_, j) => (
                      <div
                        key={j}
                        className="rounded-lg bg-white p-4 shadow-sm"
                      >
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                        <div className="mt-1 h-6 w-32 animate-pulse rounded bg-gray-200" />
                      </div>
                    ))}
                  </div>

                  {/* Installments Table */}
                  <div className="mb-4">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                  </div>
                  <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {[...Array(9)].map((_, j) => (
                            <th
                              key={j}
                              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                            >
                              <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {[...Array(3)].map((_, j) => (
                          <tr key={j}>
                            {[...Array(9)].map((_, k) => (
                              <td
                                key={k}
                                className="whitespace-nowrap px-4 py-3 text-sm text-gray-900"
                              >
                                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
