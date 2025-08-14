"use client";
import React from "react";
import { useAnnouncement } from "../../../../hooks/useData";
import { HiSpeakerphone, HiCalendar, HiUser } from "react-icons/hi";

const page = () => {
  const { data, isLoading, isFetching } = useAnnouncement();

  if (isLoading || isFetching) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
              <div className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <HiSpeakerphone className="h-6 w-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        </div>
        <p className="text-gray-600">
          Stay updated with the latest school announcements and important
          notices.
        </p>
      </div>

      <div className="space-y-4">
        {data && data.length > 0 ? (
          data.map((announcement, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                    {announcement.title}
                  </h3>
                  <div className="ml-4 flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-gray-800">
                      Notice
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 leading-relaxed">
                    <span dangerouslySetInnerHTML={{ __html: announcement.content }} />
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center text-sm text-gray-500">
                    <HiUser className="h-4 w-4 mr-1.5" />
                    <span className="font-medium">Mr. Fabiyi Tosin  (Principal)</span> 
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <HiCalendar className="h-4 w-4 mr-1.5" />
                    <span>
                      {new Date(announcement.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <HiSpeakerphone className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No announcements yet
            </h3>
            <p className="text-gray-500">
              Check back later for important updates and notices.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default page;
