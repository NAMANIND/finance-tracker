export function ReportsSkeleton() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="h-8 w-[200px] animate-pulse rounded bg-gray-200 mb-2" />
          <div className="h-4 w-[300px] animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-10 w-[120px] animate-pulse rounded bg-gray-200" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-[100px] animate-pulse rounded bg-gray-200" />
            </div>
            <div className="mt-2">
              <div className="h-8 w-[120px] animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-[100px] animate-pulse rounded bg-gray-200" />
            </div>
            <div className="mt-2">
              <div className="h-8 w-[120px] animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: 6 }).map((_, i) => (
                <th
                  key={i}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="h-4 w-[80px] animate-pulse rounded bg-gray-200" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 w-[100px] animate-pulse rounded bg-gray-200" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 w-[80px] animate-pulse rounded bg-gray-200" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 w-[100px] animate-pulse rounded bg-gray-200" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 w-[80px] animate-pulse rounded bg-gray-200" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 w-[150px] animate-pulse rounded bg-gray-200" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-8 w-[60px] animate-pulse rounded bg-gray-200" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
