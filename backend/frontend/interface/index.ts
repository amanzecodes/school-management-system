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