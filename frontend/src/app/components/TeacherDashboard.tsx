"use client";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { HiMiniMegaphone } from "react-icons/hi2";
import {
  HiAcademicCap,
  HiBookOpen,
  HiUsers,
  HiChartBar,
  HiTrophy,
  HiEye,
} from "react-icons/hi2";
import { useTeacherDashboard, useUSer } from "../../../hooks/userData";
import { redirect } from "next/navigation";
import {
  HeaderSkeleton,
  AnnouncementSkeleton,
  StatsGridSkeleton,
  ClassesTableSkeleton,
  SubjectsTableSkeleton,
  RecentGradesTableSkeleton,
} from "./skeletons/DashboardSkeletons";
import { useAnnouncement } from "../../../hooks/useData";

interface TeacherClass {
  id: string;
  name: string;
  studentCount: number;
  students: Array<{
    id: string;
    name: string;
    regNo: string;
  }>;
}

interface RecentGrade {
  id: string;
  studentName: string;
  studentRegNo: string;
  subjectName: string;
  score: number;
  createdAt: string;
}

interface TestScore {
  studentId: string;
  studentName: string;
  studentRegNo: string;
  subjectName: string;
  test1Score: number | null;
  test2Score: number | null;
  test1Date: string | null;
  test2Date: string | null;
}

export interface TeacherDashboardData {
  teacher: {
    id: string;
    classes: TeacherClass[];
    subjects: Array<{
      id: string;
      name: string;
    }>;
    totalClasses: number;
    totalSubjects: number;
    totalStudents: number;
  };
  recentGrades: RecentGrade[];
  testScores: TestScore[];
}

const TeacherDashboard = () => {
  const { data: user, isError: userError, isLoading: userLoading } = useUSer();

  const { data: dashboardData, isLoading: dashboardLoading } =
    useTeacherDashboard(user);

  const { data: announcements, isLoading: announcementsLoading } = useAnnouncement();

  if (userError) {
    alert("User is not logged in, Please login to continue");
    redirect("/");
  }

  // Only set fallback values when not loading
  const stats = dashboardData?.teacher || {
    totalClasses: 0,
    totalSubjects: 0,
    totalStudents: 0,
  };
  const classes = dashboardData?.teacher?.classes || [];
  const subjects = dashboardData?.teacher?.subjects || [];
  const recentGrades = dashboardData?.recentGrades || [];
  const testScores = dashboardData?.testScores || [];

  // Debug: Log the actual test scores data
  React.useEffect(() => {
    console.log("Raw test scores:", testScores);
    console.log("Number of test scores:", testScores.length);
  }, [testScores]);

  // Group test scores by student and subject
  const groupedTestScores = React.useMemo(() => {
    const grouped = new Map();

    testScores.forEach((score) => {
      const key = `${score.studentId}-${score.subjectName}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          studentId: score.studentId,
          studentName: score.studentName,
          studentRegNo: score.studentRegNo,
          subjectName: score.subjectName,
          test1Score: null,
          test2Score: null,
          test1Date: null,
          test2Date: null,
        });
      }

      const group = grouped.get(key);
      if (score.test1Score !== null) {
        group.test1Score = score.test1Score;
        group.test1Date = score.test1Date;
      }
      if (score.test2Score !== null) {
        group.test2Score = score.test2Score;
        group.test2Date = score.test2Date;
      }
    });

    const result = Array.from(grouped.values());
    console.log("Grouped test scores:", result);
    console.log("Number of grouped records:", result.length);
    return result;
  }, [testScores]);

  // Check if we should show loading (either loading or no data yet)
  const isDataLoading = dashboardLoading || !dashboardData;

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      {userLoading ? (
        <HeaderSkeleton />
      ) : (
        <header className="p-6 flex justify-between items-center">
          <div>
            <h1 className="sm:text-3xl text-lg font-bold text-gray-900">
              {user?.gender === "MALE" && "Mr."}{" "}
              {user?.gender === "FEMALE" && "Mrs."} {user?.firstName}{" "}
              {user?.lastName}
            </h1>
            <p className="text-gray-600 mt-1">A.B 10 High School</p>
          </div>
          <Avatar className="h-12 w-12">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="bg-green-100 text-green-700">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
        </header>
      )}

      <div className="p-6 space-y-6">
        {/* Announcements */}
        {announcementsLoading || !announcements ? (
          <AnnouncementSkeleton />
        ) : (
          announcements.length > 0 && (
            <div className="bg-green-50 border border-green-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <HiMiniMegaphone className="h-5 w-5 text-green-600" />
                <p className="text-green-800 font-medium">
                  Latest Announcement
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-green-900">
                  {announcements[0].title}
                </h3>
                <p className="text-green-800">{announcements[0].content}</p>
                <Link
                  href="/announcements"
                  className="text-gray-700 underline text-sm"
                >
                  View all announcements
                </Link>
              </div>
            </div>
          )
        )}

        {/* Stats Cards */}
        {isDataLoading ? (
          <StatsGridSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Classes
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalClasses}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <HiAcademicCap className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Subjects
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalSubjects}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <HiBookOpen className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Students
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalStudents}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <HiUsers className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Recent Grades
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {recentGrades.length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <HiTrophy className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {isDataLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ClassesTableSkeleton />
            <SubjectsTableSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Classes Table */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <HiAcademicCap className="h-5 w-5" />
                    My Classes
                  </h3>
                  <Link
                    href="/classes"
                    className="text-gray-700 hover:text-gray-900 bg-black/5 hover:bg-black/10 p-2 rounded-sm text-sm font-medium transition duration-300"
                  >
                    View All
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {classes.length > 0 ? (
                  <div className="space-y-4">
                    {classes.map((cls) => (
                      <div
                        key={cls.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {cls.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {cls.studentCount} students
                            </p>
                          </div>
                          <Link
                            href={`/classes/${cls.id}`}
                            className="text-green-600 hover:text-green-700"
                          >
                            <HiEye className="h-5 w-5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No classes assigned yet
                  </p>
                )}
              </div>
            </div>

            {/* Subjects Table */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <HiBookOpen className="h-5 w-5" />
                    My Subjects
                  </h3>
                  <Link
                    href="/subjects"
                    className="text-gray-700 hover:text-gray-900 bg-black/5 hover:bg-black/10 p-2 rounded-sm text-sm font-medium"
                  >
                    View All
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {subjects.length > 0 ? (
                  <div className="space-y-3">
                    {subjects.map((subject, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <span className="font-medium text-gray-900">
                          {subject.name}
                        </span>
                        <Link
                          href={`/subjects/${subject.id}`}
                          className="text-green-600 hover:text-green-700"
                        >
                          <HiEye className="h-5 w-5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No subjects assigned yet
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Test Scores Table */}
        {isDataLoading ? (
          <RecentGradesTableSkeleton />
        ) : (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <HiChartBar className="h-5 w-5" />
                  Recent Test Scores
                </h3>
                <Link
                  href="/grades"
                  className="text-gray-700 hover:text-gray-900 bg-black/5 hover:bg-black/10 p-2 rounded-sm text-sm font-medium"
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              {groupedTestScores.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reg No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Test 1 Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Test 2 Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groupedTestScores.map((testScore, index) => (
                      <tr
                        key={`${testScore.studentId}-${testScore.subjectName}-${index}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {testScore.studentName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {testScore.studentRegNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {testScore.subjectName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap flex items-center justify-center text-sm text-gray-900">
                          {testScore.test1Score}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {testScore.test2Score}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {testScore.test1Score !== null &&
                          testScore.test2Score !== null ? (
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                testScore.test1Score + testScore.test2Score >=
                                28
                                  ? "bg-green-100 text-green-800"
                                  : testScore.test1Score +
                                      testScore.test2Score >=
                                    20
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {testScore.test1Score + testScore.test2Score}/30
                            </span>
                          ) : (
                            <span className="text-gray-400">Incomplete</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {testScore.test1Date || testScore.test2Date
                            ? new Date(
                                testScore.test2Date || testScore.test1Date || ""
                              ).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6">
                  <p className="text-gray-500 text-center py-8">
                    No test scores available
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
