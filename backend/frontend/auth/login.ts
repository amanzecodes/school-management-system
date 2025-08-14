import { LoginSchema } from "@/app/components/LoginPage";
import api from "../lib/axiosInstance";
import { AxiosError } from "axios";

// Types and Interfaces
interface LoginData {
  regNo: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    regNo: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface ErrorResponse {
  error: string;
  message: string;
  code: string;
}

interface LoginResult {
  success: boolean;
  data?: LoginResponse["user"];
  message: string;
  error?: string;
  statusCode?: number;
}

// Custom Error Classes
class LoginError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = "LoginError";
  }
}

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}



export const loginUser = async (formData: LoginData): Promise<LoginResult> => {
  try {
    const validationResult = LoginSchema.safeParse(formData);
    if (!validationResult.success) {
      return {
        success: false,
        message: validationResult.error.issues
          .map((issue: any) => issue.message)
          .join(", "),
        error: "VALIDATION_ERROR",
        statusCode: 400,
      };
    }

    const sanitizedData = {
      regNo: formData.regNo.trim().toUpperCase(),
      password: formData.password.trim(),
    };

    console.log("Attempting login for:", sanitizedData.regNo);

    const response = await api.post<LoginResponse>(
      "/auth/login",
      sanitizedData,
      {
        timeout: 20000, // 20 second timeout
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Check if response has data
    if (!response.data) {
      throw new LoginError("No data received from server", 500, "NO_DATA");
    }

    // Validate response structure
    if (!response.data.success) {
      throw new LoginError(
        response.data.message || "Login failed",
        400,
        "LOGIN_FAILED"
      );
    }

    if (!response.data.user) {
      throw new LoginError("User data not received", 500, "NO_USER_DATA");
    }

    console.log("Login successful for:", response.data.user.regNo);

    return {
      success: true,
      data: response.data.user,
      message: response.data.message || "Login successful",
      statusCode: response.status,
    };
  } catch (error) {
    console.error("Login error:", error);

    // Handle Axios errors
    if (error instanceof AxiosError) {
      const axiosError = error as AxiosError<ErrorResponse>;

      // Network/Connection errors
      if (!axiosError.response) {
        if (axiosError.code === "ECONNABORTED") {
          return {
            success: false,
            message: "Request timed out. Please try again.",
            error: "TIMEOUT_ERROR",
            statusCode: 408,
          };
        }

        if (axiosError.code === "ERR_NETWORK") {
          return {
            success: false,
            message:
              "Network error. Please check your connection and try again.",
            error: "NETWORK_ERROR",
            statusCode: 0,
          };
        }

        return {
          success: false,
          message: "Unable to connect to server. Please try again later.",
          error: "CONNECTION_ERROR",
          statusCode: 0,
        };
      }

      // Server response errors
      const status = axiosError.response.status;
      const errorData = axiosError.response.data;

      switch (status) {
        case 400:
          return {
            success: false,
            message:
              errorData?.message || "Invalid request. Please check your input.",
            error: errorData?.code || "BAD_REQUEST",
            statusCode: 400,
          };

        case 401:
          return {
            success: false,
            message:
              errorData?.message || "Invalid credentials. Please try again.",
            error: errorData?.code || "UNAUTHORIZED",
            statusCode: 401,
          };

        case 403:
          return {
            success: false,
            message:
              errorData?.message ||
              "Access denied. Your account may be suspended.",
            error: errorData?.code || "FORBIDDEN",
            statusCode: 403,
          };

        case 404:
          return {
            success: false,
            message: "Login service not found. Please contact support.",
            error: "SERVICE_NOT_FOUND",
            statusCode: 404,
          };

        case 429:
          return {
            success: false,
            message:
              "Too many login attempts. Please wait a moment and try again.",
            error: "RATE_LIMITED",
            statusCode: 429,
          };

        case 500:
          return {
            success: false,
            message: "Server error. Please try again later.",
            error: "SERVER_ERROR",
            statusCode: 500,
          };

        case 503:
          return {
            success: false,
            message: "Service temporarily unavailable. Please try again later.",
            error: "SERVICE_UNAVAILABLE",
            statusCode: 503,
          };

        default:
          return {
            success: false,
            message:
              errorData?.message || `Unexpected error occurred (${status})`,
            error: errorData?.code || "UNKNOWN_ERROR",
            statusCode: status,
          };
      }
    }

    // Handle custom errors
    if (error instanceof LoginError) {
      return {
        success: false,
        message: error.message,
        error: error.code || "LOGIN_ERROR",
        statusCode: error.statusCode,
      };
    }

    if (error instanceof NetworkError) {
      return {
        success: false,
        message: error.message,
        error: "NETWORK_ERROR",
        statusCode: 0,
      };
    }

    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
      error: "UNKNOWN_ERROR",
      statusCode: 500,
    };
  }
};

export const getErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    VALIDATION_ERROR: "Please check your input and try again.",
    NETWORK_ERROR: "Please check your internet connection.",
    TIMEOUT_ERROR: "The request took too long. Please try again.",
    UNAUTHORIZED: "Invalid login credentials.",
    FORBIDDEN: "Your account access is restricted.",
    SERVER_ERROR: "Server is experiencing issues. Please try again later.",
    SERVICE_UNAVAILABLE: "Login service is temporarily down.",
    RATE_LIMITED: "Too many attempts. Please wait before trying again.",
  };

  return errorMessages[errorCode] || "An unexpected error occurred.";
};