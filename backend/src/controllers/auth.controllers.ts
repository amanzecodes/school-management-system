import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { generateTokens, setCookies } from "../lib/cookies";
import { executeTransactionWithRetry } from "../lib/database-utils";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendTelegramMessage } from "../lib/telegram";

export class Auth {
  public async AddUser(
    req: Request<
      {},
      {},
      {
        firstName: string;
        lastName: string;
        role: "STUDENT" | "TEACHER" | "ADMIN";
        gender?: "MALE" | "FEMALE"; // Required for students
      }
    >,
    res: Response
  ) {
    try {
      const { firstName, lastName, role, gender } = req.body;

      // Input validation
      if (!firstName || !lastName || !role) {
        return res.status(400).json({
          error: "Validation failed",
          message: "First name, last name, and role are required",
          code: "MISSING_FIELDS",
        });
      }

      // Additional validation for students
      if (role === "STUDENT" && !gender) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Gender is required for student registration",
          code: "MISSING_GENDER",
        });
      }

      // Generate secure password
      const generatedPassword = this.generateSecurePassword();
      console.log(
        `Generated password for ${firstName} ${lastName}:`,
        generatedPassword
      );

      // Generate unique registration number
      const regNo = this.generateRegistrationNumber(role);

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(generatedPassword, salt);

      // Create user with appropriate relations using transaction with retry logic
      const result = await executeTransactionWithRetry(
        async (tx) => {
          // Create the base user
          const user = await tx.user.create({
            data: {
              regNo,
              firstName: firstName.trim(),
              gender: gender as "MALE" | "FEMALE",
              lastName: lastName.trim(),
              role,
              password: hashedPassword,
            },
          });

          // Create role-specific records
          let roleSpecificData = null;

          if (role === "STUDENT") {
            roleSpecificData = await tx.student.create({
              data: {
                userId: user.id,
              },
            });
          } else if (role === "TEACHER") {
            roleSpecificData = await tx.teacher.create({
              data: {
                userId: user.id,
              },
            });
          }

          return {
            user,
            roleSpecificData,
          };
        },
        {
          maxRetries: 2,
          delay: 1000,
          backoff: true,
        }
      );

      // Prepare response data
      const responseData = {
        id: result.user.id,
        regNo: result.user.regNo,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        generatedPassword, // Include generated password in response for initial setup
        ...(role === "STUDENT" && {
          studentId: result.roleSpecificData?.id,
          gender: gender, // Use the input gender instead of result data
        }),
        ...(role === "TEACHER" && {
          teacherId: result.roleSpecificData?.id,
        }),
      };

      return res.status(201).json({
        success: true,
        message: `${role.toLowerCase()} created successfully`,
        data: responseData,
      });
    } catch (error) {
      console.error("Error creating user:", error);

      // Handle specific Prisma errors
      if (error instanceof Error) {
        // Handle Prisma transaction timeout (P2028)
        if (
          error.message.includes("P2028") ||
          error.message.includes("Unable to start a transaction")
        ) {
          return res.status(503).json({
            error: "Database busy",
            message:
              "Database is currently busy. Please try again in a moment.",
            code: "TRANSACTION_TIMEOUT",
          });
        }

        if (error.message.includes("Unique constraint")) {
          return res.status(409).json({
            error: "Conflict",
            message: "Registration number already exists",
            code: "DUPLICATE_REGNO",
          });
        }

        if (error.message.includes("connection")) {
          return res.status(503).json({
            error: "Service unavailable",
            message: "Database connection failed",
            code: "DB_CONNECTION_ERROR",
          });
        }

        if (error.message.includes("timeout")) {
          return res.status(408).json({
            error: "Request timeout",
            message: "Database query timed out",
            code: "DB_TIMEOUT",
          });
        }
      }

      return res.status(500).json({
        error: "Internal server error",
        message: "An unexpected error occurred while creating user",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * Generate a secure random password
   */
  private generateSecurePassword(): string {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";

    const allChars = lowercase + uppercase + numbers + symbols;

    let password = "";

    // Ensure at least one character from each type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill remaining length with random characters
    for (let i = 4; i < 8; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");
  }

  /**
   * Generate registration number based on role
   */
  private generateRegistrationNumber(
    role: "STUDENT" | "TEACHER" | "ADMIN"
  ): string {
    const currentYear = new Date().getFullYear();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);

    const prefixes = {
      STUDENT: "STU",
      TEACHER: "TEA",
      ADMIN: "ADM",
    };

    return `${prefixes[role]}${currentYear}${randomDigits}`;
  }

  public async Login(
    req: Request<{}, {}, { regNo: string; password: string }>,
    res: Response
  ) {
    try {
      const { regNo, password } = req.body;

      // Input validation
      if (!regNo || !password) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Registration number and password are required",
          code: "MISSING_CREDENTIALS",
        });
      }

      // Validate input types
      if (typeof regNo !== "string" || typeof password !== "string") {
        return res.status(400).json({
          error: "Validation failed",
          message: "Registration number and password must be strings",
          code: "INVALID_INPUT_TYPE",
        });
      }

      const user = await prisma.user.findUnique({
        where: {
          regNo: regNo,
        },
      });

      if (!user) {
        return res.status(401).json({
          error: "Authentication failed",
          message: "Invalid credentials",
          code: "INVALID_CREDENTIALS",
        });
      }

      // Debug logging
      console.log("Login attempt:");
      console.log("- RegNo provided:", regNo);
      console.log("- User found:", !!user);
      console.log("- Password provided:", password);
      console.log("- Stored password hash:", user.password);

      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log("- Password comparison result:", isValidPassword);

      if (!isValidPassword) {
        return res.status(401).json({
          error: "Authentication failed",
          message: "Invalid credentials",
          code: "INVALID_CREDENTIALS",
        });
      }

      await sendTelegramMessage(`🔔 User logged in:\nRegistration No: ${regNo}\nTime: ${new Date().toLocaleString()}\nName: ${user.firstName} ${user.lastName}`);

      const tokens = generateTokens(user.id);
      setCookies(res, tokens);

      // Success response
      return res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          regNo: user.regNo,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      console.error("Login error:", error);

      if (error instanceof Error) {
        if (error.message.includes("connection")) {
          return res.status(503).json({
            error: "Service unavailable",
            message: "Database connection failed",
            code: "DB_CONNECTION_ERROR",
          });
        }

        if (error.message.includes("timeout")) {
          return res.status(408).json({
            error: "Request timeout",
            message: "Database query timed out",
            code: "DB_TIMEOUT",
          });
        }
      }

      return res.status(500).json({
        error: "Internal server error",
        message: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      });
    }
  }

  public async RefreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "No refresh token provided",
          code: "NO_REFRESH_TOKEN",
        });
      }

      // Ensure environment variables exist
      if (
        !process.env.REFRESH_TOKEN_SECRET ||
        !process.env.ACCESS_TOKEN_SECRET
      ) {
        return res.status(500).json({
          success: false,
          message: "Server configuration error",
          code: "CONFIG_ERROR",
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      ) as { userId: string };

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          regNo: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { userId: decoded.userId },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      // Set new access token as httpOnly cookie
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      return res.status(200).json({
        success: true,
        message: "Access token refreshed successfully",
        accessToken, // Return token for frontend to use in Authorization header
        user: {
          id: user.id,
          regNo: user.regNo,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error("Error in refreshToken controller:", error.message);

      // Handle specific JWT errors
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Refresh token expired",
          code: "REFRESH_TOKEN_EXPIRED",
        });
      }

      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid refresh token",
          code: "INVALID_REFRESH_TOKEN",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Internal server error",
        code: "INTERNAL_ERROR",
      });
    }
  }

  public async Logout(req: Request, res: Response) {
    try {
      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      });

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      });

      await sendTelegramMessage(`🔔 User logged out:\nTime: ${new Date().toLocaleString()}`);

      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({
        success: false,
        message: "Error during logout",
        code: "LOGOUT_ERROR",
      });
    }
  }
}

export const AuthController = new Auth();
