import api from "../lib/axiosInstance";

export const Logout = async () => {
  try {
    await api.post("/auth/logout");
    window.location.href = "/";
  } catch (error) {
    console.error("Logout failed:", error);
    window.location.href = "/";
  }
};
