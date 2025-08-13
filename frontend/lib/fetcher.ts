import { ApiResponse } from "../types/api";
import api from "./axiosInstance";
export const fetcher = async <T>(url: string): Promise<T> => {
  const res = await api.get<ApiResponse<T>>(url);
  return res.data.data;
};
