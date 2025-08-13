import { useQuery } from "@tanstack/react-query";
import api from "../lib/axiosInstance";
import { fetcher } from "../lib/fetcher";

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export function useAnnouncement(){
    return useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: () =>  fetcher<Announcement[]>("/users/announcements"),
  })
}