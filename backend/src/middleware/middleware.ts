import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import dotenv from "dotenv";

dotenv.config();

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        regNo: string;
        firstName: string;
        lastName: string;
        role: import("../generated/prisma/index").$Enums.Role;
        password: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
      };
    }
  }
}

export const protectRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if access token exists
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        message: "No access token provided. Please log in.",
        code: "NO_TOKEN",
      });
    }

    // Check if JWT secret is configured
    if (!process.env.ACCESS_TOKEN_SECRET) {
      console.error("ACCESS_TOKEN_SECRET is not configured");
      return res.status(500).json({
        success: false,
        error: "Server configuration error",
        message: "Authentication service is not properly configured",
        code: "CONFIG_ERROR",
      });
    }

    // Verify and decode the JWT token
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET) as {
        userId: string;
      };
    } catch (jwtError: any) {
      console.log("JWT verification failed:", jwtError.message);

      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          error: "Token expired",
          message: "Your session has expired. Please log in again.",
          code: "TOKEN_EXPIRED",
        });
      }

      if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          error: "Invalid token",
          message: "Authentication token is invalid. Please log in again.",
          code: "INVALID_TOKEN",
        });
      }

      if (jwtError.name === "NotBeforeError") {
        return res.status(401).json({
          success: false,
          error: "Token not active",
          message: "Authentication token is not yet active.",
          code: "TOKEN_NOT_ACTIVE",
        });
      }

      // Generic JWT error
      return res.status(401).json({
        success: false,
        error: "Token verification failed",
        message: "Could not verify authentication token. Please log in again.",
        code: "TOKEN_VERIFICATION_FAILED",
      });
    }

    // Validate decoded token structure
    if (!decoded.userId || typeof decoded.userId !== "string") {
      console.log("Invalid token structure:", decoded);
      return res.status(401).json({
        success: false,
        error: "Invalid token structure",
        message:
          "Authentication token has invalid format. Please log in again.",
        code: "INVALID_TOKEN_STRUCTURE",
      });
    }

    // Find user in database
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });
    } catch (dbError: any) {
      console.error("Database error in protectRoute:", dbError.message);

      if (dbError.message.includes("connection")) {
        return res.status(503).json({
          success: false,
          error: "Database connection failed",
          message: "Unable to connect to database. Please try again later.",
          code: "DB_CONNECTION_ERROR",
        });
      }

      if (dbError.message.includes("timeout")) {
        return res.status(408).json({
          success: false,
          error: "Database timeout",
          message: "Database query timed out. Please try again.",
          code: "DB_TIMEOUT",
        });
      }

      // Generic database error
      return res.status(500).json({
        success: false,
        error: "Database error",
        message:
          "An error occurred while verifying your account. Please try again.",
        code: "DB_ERROR",
      });
    }

    // Check if user exists
    if (!user) {
      console.log("User not found for ID:", decoded.userId);
      return res.status(401).json({
        success: false,
        error: "User not found",
        message: "Your account could not be found. Please contact support.",
        code: "USER_NOT_FOUND",
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      console.log("Inactive user attempted access:", user.regNo);
      return res.status(403).json({
        success: false,
        error: "Account suspended",
        message: "Your account has been suspended. Please contact support.",
        code: "ACCOUNT_SUSPENDED",
      });
    }

    // Attach user to request object
    req.user = user;

    // Log successful authentication (optional, remove in production if needed)
    console.log(
      `Authentication successful for user: ${user.regNo} (${user.role})`
    );

    next();
  } catch (error: any) {
    // Catch any unexpected errors
    console.error("Unexpected error in protectRoute middleware:", {
      message: error.message,
      stack: error.stack,
      userId: req.cookies.accessToken ? "Token present" : "No token",
    });

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message:
        "An unexpected error occurred during authentication. Please try again.",
      code: "INTERNAL_ERROR",
    });
  }
};

// Role-based access control middleware
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
          message: "You must be logged in to access this resource.",
          code: "NOT_AUTHENTICATED",
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        console.log(
          `Access denied for role ${
            req.user.role
          }. Required: ${allowedRoles.join(", ")}`
        );
        return res.status(403).json({
          success: false,
          error: "Insufficient permissions",
          message: `Access denied. Required role: ${allowedRoles.join(
            " or "
          )}.`,
          code: "INSUFFICIENT_PERMISSIONS",
        });
      }

      next();
    } catch (error: any) {
      console.error("Error in requireRole middleware:", error.message);
      return res.status(500).json({
        success: false,
        error: "Authorization error",
        message: "An error occurred while checking permissions.",
        code: "AUTHORIZATION_ERROR",
      });
    }
  };
};
