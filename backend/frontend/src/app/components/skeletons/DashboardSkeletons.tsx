import React from "react";

// Header Skeleton
export const HeaderSkeleton = () => (
  <header className="p-6 flex justify-between items-center animate-pulse">
    <div>
      <div className="h-8 bg-gray-300 rounded-md w-48 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded-md w-32"></div>
    </div>
    <div className="h-12 w-12 bg-gray-300 rounded-full"></div>
  </header>
);

// Announcement Skeleton
export const AnnouncementSkeleton = () => (
  <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 animate-pulse">
    <div className="flex items-center gap-2 mb-3">
      <div className="h-5 w-5 bg-gray-300 rounded"></div>
      <div className="h-4 bg-gray-300 rounded-md w-32"></div>
    </div>
    <div className="space-y-2">
      <div className="h-5 bg-gray-300 rounded-md w-3/4"></div>
      <div className="h-4 bg-gray-300 rounded-md w-full"></div>
      <div className="h-4 bg-gray-300 rounded-md w-2/3"></div>
      <div className="h-3 bg-gray-300 rounded-md w-40"></div>
    </div>
  </div>
);

// Stats Card Skeleton
export const StatsCardSkeleton = () => (
  <div className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 bg-gray-300 rounded-md w-20 mb-2"></div>
        <div className="h-8 bg-gray-300 rounded-md w-12"></div>
      </div>
      <div className="h-12 w-12 bg-gray-300 rounded-lg"></div>
    </div>
  </div>
);

// Stats Grid Skeleton
export const StatsGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[1, 2, 3, 4].map((item) => (
      <StatsCardSkeleton key={item} />
    ))}
  </div>
);

// Classes Table Skeleton
export const ClassesTableSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200">
    <div className="px-6 py-4 border-b border-gray-200 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-gray-300 rounded"></div>
          <div className="h-5 bg-gray-300 rounded-md w-24"></div>
        </div>
        <div className="h-8 bg-gray-300 rounded-md w-16"></div>
      </div>
    </div>
    <div className="p-6 animate-pulse">
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div key={item} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-5 bg-gray-300 rounded-md w-32 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded-md w-20"></div>
              </div>
              <div className="h-5 w-5 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Subjects Table Skeleton
export const SubjectsTableSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200">
    <div className="px-6 py-4 border-b border-gray-200 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-gray-300 rounded"></div>
          <div className="h-5 bg-gray-300 rounded-md w-28"></div>
        </div>
        <div className="h-8 bg-gray-300 rounded-md w-16"></div>
      </div>
    </div>
    <div className="p-6 animate-pulse">
      <div className="space-y-3">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
          >
            <div className="h-4 bg-gray-300 rounded-md w-24"></div>
            <div className="h-5 w-5 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Recent Grades Table Skeleton
export const RecentGradesTableSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200">
    <div className="px-6 py-4 border-b border-gray-200 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-gray-300 rounded"></div>
          <div className="h-5 bg-gray-300 rounded-md w-32"></div>
        </div>
        <div className="h-8 bg-gray-300 rounded-md w-16"></div>
      </div>
    </div>
    <div className="overflow-x-auto animate-pulse">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {["Student", "Reg No", "Subject", "Score", "Date"].map((header) => (
              <th key={header} className="px-6 py-3 text-left">
                <div className="h-3 bg-gray-300 rounded-md w-16"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((item) => (
            <tr key={item}>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-300 rounded-md w-24"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-300 rounded-md w-20"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-300 rounded-md w-16"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-6 bg-gray-300 rounded-full w-12"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-300 rounded-md w-20"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
