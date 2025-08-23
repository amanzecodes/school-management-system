import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

interface SingleUploadParams {
  userId: string;
  subjectId: string;
}

enum TEST {
  TEST1 = "TEST1",
  TEST2 = "TEST2",
}

interface SingleUploadBody {
  score: number;
  testType: string;
}

class Actions {
  public async SingleUpload(
    req: Request<SingleUploadParams, {}, SingleUploadBody, {}>,
    res: Response
  ) {
    try {
      const { userId, subjectId } = req.params;
      const { testType } = req.body;
      const { score } = req.body;
      const teacherId = req.user?.id;

      if (!teacherId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
          message: "You must be logged in to access this resource.",
          code: "NOT_AUTHENTICATED",
        });
      }

      if (!userId || !testType || score === null || score === undefined) {
        return res.status(400).json({
          success: false,
          message: "Please ensure all required fields are provided",
          code: "MISSING_CREDENTIALS",
        });
      }

      if (!Object.values(TEST).includes(testType as TEST)) {
        return res.status(400).json({
          success: false,
          message: "Invalid test type",
          code: "INVALID_TEST_TYPE",
        });
      }

      if (typeof score !== "number" || score < 0 || score > 100) {
        return res.status(400).json({
          success: false,
          message: "Invalid score value",
          code: "INVALID_SCORE",
        });
      }

      const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
      if (!teacher || teacher.role !== "TEACHER") {
        return res.status(403).json({
          success: false,
          message: "Only teachers can upload scores",
          code: "UNAUTHORIZED_ACTION",
        });
      }


      const selectedSubject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!selectedSubject) {
        return res.status(404).json({
          success: false,
          message: "The subject was not found",
          code: "SUBJECT_NOT_FOUND",
        });
      }

      const selectedStudent = await prisma.student.findUnique({ where: { id: userId } });
      if (!selectedStudent) {
        return res.status(404).json({
          success: false,
          message: "The student was not found",
          code: "STUDENT_NOT_FOUND",
        });
      }

      const studentId = selectedStudent.id;

      console.log(studentId)

      const uploadTest = await prisma.testScore.upsert({
        where: {
          subjectId_test_studentId: {
            studentId,
            subjectId,
            test: testType as TEST,
          },
        },
        update: { score, date: new Date() },
        create: { studentId, subjectId, test: testType as TEST, score },
      });

      return res.status(200).json({
        success: true,
        message: "Result uploaded successfully",
        data: uploadTest,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Server error. Please try again later.",
      });
    }
  }
}

export const ActionController = new Actions();