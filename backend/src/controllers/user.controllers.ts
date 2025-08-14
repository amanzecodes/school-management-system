import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export class User {
  // Get current authenticated user's information
  public async getCurrentUser(req: Request, res: Response) {
    try {
      /***
       *checks if you are authenticated
       */
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
          message: "You must be logged in to access this resource.",
          code: "NOT_AUTHENTICATED",
        });
      }

      // Return user information (excluding password)
      const { password, ...userWithoutPassword } = req.user;

      return res.status(200).json({
        success: true,
        message: "User information retrieved successfully",
        data: {
          ...userWithoutPassword,
          fullName: `${userWithoutPassword.firstName} ${userWithoutPassword.lastName}`,
        },
      });
    } catch (error: any) {
      console.error("Error in getCurrentUser:", error.message);

      if (error.message.includes("connection")) {
        return res.status(503).json({
          success: false,
          error: "Database connection failed",
          message: "Unable to connect to database. Please try again later.",
          code: "DB_CONNECTION_ERROR",
        });
      }

      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message:
          "An unexpected error occurred while retrieving user information.",
        code: "INTERNAL_ERROR",
      });
    }
  }

  // Get user by ID (for admin or self-access)
  public async getUserById(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      // Validate userId parameter
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          message: "User ID is required.",
          code: "MISSING_USER_ID",
        });
      }

      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
          message: "You must be logged in to access this resource.",
          code: "NOT_AUTHENTICATED",
        });
      }

      // Check permissions (admin can access any user, others can only access their own data)
      if (req.user.id !== userId && req.user.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          error: "Insufficient permissions",
          message: "You can only access your own user information.",
          code: "ACCESS_DENIED",
        });
      }

      // Fetch user from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          regNo: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
          message: "The requested user could not be found.",
          code: "USER_NOT_FOUND",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User information retrieved successfully",
        data: {
          ...user,
          fullName: `${user.firstName} ${user.lastName}`,
        },
      });
    } catch (error: any) {
      console.error("Error in getUserById:", error.message);

      if (error.message.includes("connection")) {
        return res.status(503).json({
          success: false,
          error: "Database connection failed",
          message: "Unable to connect to database. Please try again later.",
          code: "DB_CONNECTION_ERROR",
        });
      }

      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message:
          "An unexpected error occurred while retrieving user information.",
        code: "INTERNAL_ERROR",
      });
    }
  }

  // Update user profile (basic information only)
  public async updateProfile(
    req: Request<{}, {}, { firstName?: string; lastName?: string }>,
    res: Response
  ) {
    try {
      const { firstName, lastName } = req.body;

      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
          message: "You must be logged in to update your profile.",
          code: "NOT_AUTHENTICATED",
        });
      }

      // Validate input
      if (!firstName && !lastName) {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          message: "At least one field (firstName or lastName) is required.",
          code: "NO_UPDATE_DATA",
        });
      }

      // Prepare update data
      let updateData: { firstName: string; lastName: string } = {
        firstName: "",
        lastName: "",
      };
      if (firstName) {
        if (typeof firstName !== "string" || firstName.trim().length < 2) {
          return res.status(400).json({
            success: false,
            error: "Validation error",
            message: "First name must be at least 2 characters long.",
            code: "INVALID_FIRST_NAME",
          });
        }
        updateData.firstName = firstName.trim();
      }

      if (lastName) {
        if (typeof lastName !== "string" || lastName.trim().length < 2) {
          return res.status(400).json({
            success: false,
            error: "Validation error",
            message: "Last name must be at least 2 characters long.",
            code: "INVALID_LAST_NAME",
          });
        }
        updateData.lastName = lastName.trim();
      }

      // Update user in database
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
        select: {
          id: true,
          regNo: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          updatedAt: true,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: {
          ...updatedUser,
          fullName: `${updatedUser.firstName} ${updatedUser.lastName}`,
        },
      });
    } catch (error: any) {
      console.error("Error in updateProfile:", error.message);

      if (error.message.includes("connection")) {
        return res.status(503).json({
          success: false,
          error: "Database connection failed",
          message: "Unable to connect to database. Please try again later.",
          code: "DB_CONNECTION_ERROR",
        });
      }

      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred while updating profile.",
        code: "INTERNAL_ERROR",
      });
    }
  }

  // Get basic statistics for dashboard (for teachers)
  public async getDashboardStats(req: Request, res: Response) {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
          message: "You must be logged in to access this resource.",
          code: "NOT_AUTHENTICATED",
        });
      }

      let stats = {};

      if (req.user.role === "TEACHER") {
        // Get teacher-specific stats
        const [classCount, subjectCount] = await Promise.all([
          prisma.class.count({
            where: {
              classTeacher: {
                userId: req.user.id,
              },
            },
          }),
          prisma.teachingAssignment.count({
            where: {
              teacher: {
                userId: req.user.id,
              },
            },
          }),
        ]);

        stats = {
          totalClasses: classCount,
          totalSubjects: subjectCount,
          role: "TEACHER",
        };
      } else if (req.user.role === "STUDENT") {
        // Get student-specific stats
        const [gradeCount, attendanceCount] = await Promise.all([
          prisma.grade.count({
            where: {
              student: {
                userId: req.user.id,
              },
            },
          }),
          prisma.attendance.count({
            where: {
              student: {
                userId: req.user.id,
              },
              present: true,
            },
          }),
        ]);

        stats = {
          totalGrades: gradeCount,
          attendanceCount: attendanceCount,
          role: "STUDENT",
        };
      }

      return res.status(200).json({
        success: true,
        message: "Dashboard statistics retrieved successfully",
        data: stats,
      });
    } catch (error: any) {
      console.error("Error in getDashboardStats:", error.message);

      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred while retrieving statistics.",
        code: "INTERNAL_ERROR",
      });
    }
  }

  // Get detailed teacher dashboard data
  public async getTeacherDashboard(req: Request, res: Response) {
    try {
      // Check if user is authenticated and is a teacher
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
          message: "You must be logged in to access this resource.",
          code: "NOT_AUTHENTICATED",
        });
      }

      if (req.user.role !== "TEACHER") {
        return res.status(403).json({
          success: false,
          error: "Access denied",
          message: "Only teachers can access this endpoint.",
          code: "INSUFFICIENT_PERMISSIONS",
        });
      }

      // Get teacher record
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user.id },
        include: {
          supervisedClass: {
            include: {
              students: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      regNo: true,
                    },
                  },
                },
              },
            },
          },
          assignments: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                },
              },
              class: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          error: "Teacher not found",
          message: "Teacher profile not found.",
          code: "TEACHER_NOT_FOUND",
        });
      }

      // Get test scores for the teacher's subjects and students
      const testScores = await prisma.testScore.findMany({
        where: {
          subject: {
            assignments: {
              some: {
                teacherId: teacher.id,
              },
            },
          },
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  regNo: true,
                },
              },
            },
          },
          subject: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          date: "desc",
        },
        take: 50, // Get more test scores to see all data
      });

      console.log("Total test scores found:", testScores.length);
      console.log(
        "English Language test scores:",
        testScores.filter((score) => score.subject.name === "English Language")
          .length
      );

      // Get recent grades
      const recentGrades = await prisma.grade.findMany({
        where: {
          subject: {
            assignments: {
              some: {
                teacher: {
                  id: teacher.id,
                },
              },
            },
          },
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  regNo: true,
                },
              },
            },
          },
          subject: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      });

      // Calculate totals
      const totalStudents = teacher.supervisedClass?.students.length || 0;
      const uniqueSubjects = new Set(
        teacher.assignments.map((a) => a.subject.id)
      );
      const totalUniqueSubjects = uniqueSubjects.size;

      return res.status(200).json({
        success: true,
        message: "Teacher dashboard data retrieved successfully",
        data: {
          teacher: {
            id: teacher.id,
            classes: teacher.supervisedClass
              ? [
                  {
                    id: teacher.supervisedClass.id,
                    name: teacher.supervisedClass.name,
                    studentCount: teacher.supervisedClass.students.length,
                    students: teacher.supervisedClass.students.map(
                      (student: any) => ({
                        id: student.id,
                        name: `${student.user.firstName} ${student.user.lastName}`,
                        regNo: student.user.regNo,
                      })
                    ),
                  },
                ]
              : [],
            subjects: Array.from(
              new Map(
                teacher.assignments.map((assignment) => [
                  assignment.subject.id,
                  {
                    id: assignment.subject.id,
                    name: assignment.subject.name,
                  },
                ])
              ).values()
            ),
            totalClasses: teacher.supervisedClass ? 1 : 0,
            totalSubjects: totalUniqueSubjects,
            totalStudents,
          },
          recentGrades: recentGrades.map((grade) => ({
            id: grade.id,
            studentName: `${grade.student.user.firstName} ${grade.student.user.lastName}`,
            studentRegNo: grade.student.user.regNo,
            subjectName: grade.subject.name,
            score: grade.score,
            createdAt: grade.createdAt,
          })),
          testScores: testScores.map((score) => ({
            id: score.id,
            studentId: score.studentId,
            studentName: `${score.student.user.firstName} ${score.student.user.lastName}`,
            studentRegNo: score.student.user.regNo,
            subjectName: score.subject.name,
            test1Score: score.test === "TEST1" ? score.score : null,
            test2Score: score.test === "TEST2" ? score.score : null,
            test1Date: score.test === "TEST1" ? score.date : null,
            test2Date: score.test === "TEST2" ? score.date : null,
          })),
        },
      });
    } catch (error: any) {
      console.error("Error in getTeacherDashboard:", error.message);

      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message:
          "An unexpected error occurred while retrieving dashboard data.",
        code: "INTERNAL_ERROR",
      });
    }
  }

  // Get announcements
  public async getAnnouncements(req: Request, res: Response) {
    try {
      const announcements = await prisma.announcement.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      });

      return res.status(200).json({
        success: true,
        message: "Announcements retrieved successfully",
        data: announcements,
      });
    } catch (error: any) {
      console.error("Error in getAnnouncements:", error.message);

      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred while retrieving announcements.",
        code: "INTERNAL_ERROR",
      });
    }
  }
}

export const userController = new User();
