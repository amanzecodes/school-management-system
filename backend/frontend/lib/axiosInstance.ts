import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // send cookies automatically
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor to add auth header if we have a token stored locally
api.interceptors.request.use(
  (config) => {
    // The access token is stored as httpOnly cookie, so we don't need to manually add it
    // The browser will automatically include it with withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // List of public routes where you DON'T want to run refresh logic
    const publicRoutes = ["/auth/login", "/auth/register", "/auth/adduser"];

    // If error from a public route, just reject immediately
    if (publicRoutes.some((url) => originalRequest.url?.includes(url))) {
      return Promise.reject(error);
    }

    // Check if it's a 401 error and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post("/auth/refresh");

        if (data.success && data.accessToken) {
          // Process queued requests
          processQueue(null, data.accessToken);

          // Retry original request
          return api(originalRequest);
        } else {
          throw new Error("Failed to refresh token");
        }
      } catch (refreshError) {
        // Process queued requests with error
        processQueue(refreshError, null);

        // Clear any auth state and redirect to login
        // You can customize this part based on your auth state management
        if (typeof window !== "undefined") {
          // Clear any local storage auth data if you have any
          localStorage.removeItem("user");

          // Redirect to login page
          window.location.href = "/";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
