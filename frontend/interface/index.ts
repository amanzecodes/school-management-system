export interface CurrentUser {
  id: string;
  regNo: string;
  firstName: string;
  lastName: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  gender: "MALE" | "FEMALE";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface TestScore {
  studentId: string;
  studentName: string;
  studentRegNo: string;
  subjectName: string;
  test1Score: number | null;
  test2Score: number | null;
  test1Date: string | null;
  test2Date: string | null;
}

export interface RecentGrade {
  id: string;
  studentName: string;
  studentRegNo: string;
  subjectName: string;
  score: number;
  createdAt: string;
}

export interface TeacherClass {
  id: string;
  name: string;
  studentCount: number;
  students: Array<{
    id: string;
    name: string;
    regNo: string;
  }>;
}
