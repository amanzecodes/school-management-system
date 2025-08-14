import { useQuery } from "@tanstack/react-query";
import { fetcher } from "../lib/fetcher";
import { CurrentUser } from "../interface";
import { TeacherDashboardData } from "../interface";
import { AxiosError } from "axios";


//get current user, extract all their id and pass it into any parameters man!!!
export function useUSer() {
  return useQuery<CurrentUser>({
    queryKey: ["currentUser"],
    queryFn: () => fetcher<CurrentUser>("/users/me"),
  });
}


//this is accepting user id with the help of our useUser hook
export function useTeacherDashboard(user?: { id: string; role: string }) {
  return useQuery<TeacherDashboardData, AxiosError>({
    queryKey: ["teacherDashboard", user?.id],
    queryFn: () => fetcher<TeacherDashboardData>("/users/teacher"),
    enabled: !!user && user.role === "TEACHER",
  });
}