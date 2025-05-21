export function AgentDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Agent Header */}
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

      {/* Main Content */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="p-6">
          {/* Table Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
              <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
            </div>

            <div className="rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...Array(5)].map((_, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
                            <div className="ml-4">
                              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                              <div className="mt-1 h-3 w-32 animate-pulse rounded bg-gray-200" />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                </div>
                <div>
                  <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
