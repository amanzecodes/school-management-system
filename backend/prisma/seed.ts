import bcrypt from "bcrypt";
import { PrismaClient, Role, Gender, Test } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data in correct dependency order
  await prisma.$transaction([
    // Delete records that depend on others first
    prisma.testScore.deleteMany(),
    prisma.examScore.deleteMany(),
    prisma.result.deleteMany(),
    prisma.grade.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.week.deleteMany(),
    prisma.teachingAssignment.deleteMany(),
    prisma.announcement.deleteMany(),

    // Delete students before classes (students reference classes)
    prisma.student.deleteMany(),

    // Delete classes before teachers (classes reference teachers)
    prisma.class.deleteMany(),

    // Delete teachers and subjects (no dependencies between them)
    prisma.teacher.deleteMany(),
    prisma.subject.deleteMany(),

    // Delete departments before users (can be deleted independently)
    prisma.department.deleteMany(),

    // Delete users last (teachers and students reference users)
    prisma.user.deleteMany(),
  ]);

  // Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      role: Role.ADMIN,
      firstName: "Admin",
      lastName: "User",
      gender: Gender.MALE,
      regNo: "ADM001",
      password: await bcrypt.hash("admin123", 10),
    },
  });

  // Create Departments
  const departments = await Promise.all([
    prisma.department.create({
      data: { name: "Science Department" },
    }),
    prisma.department.create({
      data: { name: "Arts Department" },
    }),
    prisma.department.create({
      data: { name: "Commercial Department" },
    }),
  ]);

  // Create Subjects (reduced to essential subjects only)
  const subjects = await Promise.all([
    // Core subjects only
    prisma.subject.create({ data: { name: "Mathematics" } }),
    prisma.subject.create({ data: { name: "English Language" } }),
    prisma.subject.create({ data: { name: "Basic Science" } }),
    prisma.subject.create({ data: { name: "Social Studies" } }),
    prisma.subject.create({ data: { name: "Computer Studies" } }),
  ]);

  // Create Teacher Users and Teachers (reduced to 3 teachers)
  const teacherData = [
    {
      firstName: "John",
      lastName: "Adebayo",
      regNo: "TCH001",
      gender: Gender.MALE,
    },
    {
      firstName: "Sarah",
      lastName: "Okafor",
      regNo: "TCH002",
      gender: Gender.FEMALE,
    },
    {
      firstName: "Michael",
      lastName: "Okon",
      regNo: "TCH003",
      gender: Gender.MALE,
    },
  ];

  const teachers = [];
  for (const teacher of teacherData) {
    const teacherUser = await prisma.user.create({
      data: {
        ...teacher,
        role: Role.TEACHER,
        password: await bcrypt.hash("teacher123", 10),
      },
    });

    const createdTeacher = await prisma.teacher.create({
      data: {
        userId: teacherUser.id,
      },
    });

    teachers.push(createdTeacher);
  }

  // Create Classes with Class Teachers (reduced to 3 classes)
  const classData = [
    { name: "JSS 1A", departmentId: null },
    { name: "JSS 2A", departmentId: null },
    { name: "SS 1 Science", departmentId: departments[0].id },
  ];

  const classes = [];
  for (let i = 0; i < classData.length; i++) {
    const classInfo = classData[i];
    const teacher = teachers[i];

    if (!classInfo || !teacher) {
      throw new Error(`Missing data for class at index ${i}`);
    }

    const classItem = await prisma.class.create({
      data: {
        name: classInfo.name,
        departmentId: classInfo.departmentId,
        classTeacherId: teacher.id, // Assign each teacher as a class teacher
      },
    });
    classes.push(classItem);
  }

  // Create Student Users and Students (reduced to 8 students)
  const studentData: Array<{
    firstName: string;
    lastName: string;
    regNo: string;
    gender: Gender;
    classId: string;
  }> = [];
  const studentNames = [
    ["Adebola", "Fashina"],
    ["Chioma", "Nwosu"],
    ["Kemi", "Adeyemi"],
    ["Tunde", "Olawale"],
    ["Funmi", "Bakare"],
    ["Segun", "Afolabi"],
    ["Ngozi", "Okoro"],
    ["Femi", "Adebisi"],
  ];

  for (let i = 0; i < studentNames.length; i++) {
    const studentName = studentNames[i];
    if (!studentName || studentName.length < 2) {
      throw new Error(`Invalid student name at index ${i}`);
    }

    const [firstName, lastName] = studentName;
    const regNo = `STU${(i + 1).toString().padStart(3, "0")}`;
    const gender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
    const randomClass = classes[Math.floor(Math.random() * classes.length)];

    if (!randomClass) {
      throw new Error("No classes available for student assignment");
    }

    const classId = randomClass.id;

    studentData.push({
      firstName: firstName!,
      lastName: lastName!,
      regNo,
      gender,
      classId,
    });
  }

  const students = [];
  for (const student of studentData) {
    const studentUser = await prisma.user.create({
      data: {
        firstName: student.firstName,
        lastName: student.lastName,
        regNo: student.regNo,
        gender: student.gender,
        role: Role.STUDENT,
        password: await bcrypt.hash("student123", 10),
      },
    });

    const createdStudent = await prisma.student.create({
      data: {
        userId: studentUser.id,
        classId: student.classId,
      },
    });

    students.push(createdStudent);
  }

  // Create Teaching Assignments
  const teachingAssignments = [];

  // Assign subjects to teachers and classes (reduced to 3 subjects per class)
  for (const classItem of classes) {
    const subjectsForClass = subjects.slice(0, Math.min(3, subjects.length)); // 3 subjects per class

    for (let i = 0; i < subjectsForClass.length; i++) {
      const teacherIndex = i % teachers.length;
      const teacher = teachers[teacherIndex];
      const subject = subjectsForClass[i];

      if (!teacher || !subject) {
        throw new Error(
          `Missing teacher or subject for assignment at index ${i}`
        );
      }

      const assignment = await prisma.teachingAssignment.create({
        data: {
          teacherId: teacher.id,
          subjectId: subject.id,
          classId: classItem.id,
        },
      });

      teachingAssignments.push(assignment);
    }
  }

  // Create Weeks for Attendance (reduced to 6 weeks for demo)
  const weeks = [];
  const startDate = new Date("2024-01-08"); // Start of academic session

  for (let i = 0; i < 6; i++) {
    // Only 6 weeks for demo
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + i * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const week = await prisma.week.create({
      data: {
        startDate: weekStart,
        endDate: weekEnd,
      },
    });

    weeks.push(week);
  }

  // Create Attendance Records (greatly reduced)
  console.log("📊 Creating attendance records...");

  for (const student of students.slice(0, 5)) {
    // Only 5 students
    for (const week of weeks.slice(0, 4)) {
      // Only 4 weeks
      const present = Math.random() > 0.15; // 85% attendance rate

      await prisma.attendance.create({
        data: {
          studentId: student.id,
          classId: student.classId!,
          weekId: week.id,
          present,
        },
      });
    }
  }

  // Create Test Scores, Exam Scores, and calculate Grades
  console.log("📝 Creating test scores, exam scores, and grades...");

  const generateScore = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  for (const assignment of teachingAssignments) {
    const studentsInClass = students.filter(
      (s) => s.classId === assignment.classId
    );

    for (const student of studentsInClass.slice(0, 3)) {
      // Only 3 students per class for demo
      // Create Test 1 Score
      const test1Score = generateScore(1, 15);
      await prisma.testScore.create({
        data: {
          studentId: student.id,
          subjectId: assignment.subjectId,
          test: Test.TEST1,
          score: test1Score,
        },
      });

      // Create Test 2 Score
      const test2Score = generateScore(1, 15);
      await prisma.testScore.create({
        data: {
          studentId: student.id,
          subjectId: assignment.subjectId,
          test: Test.TEST2,
          score: test2Score,
        },
      });

      // Create Exam Score
      const examScore = generateScore(20, 40);
      await prisma.examScore.create({
        data: {
          studentId: student.id,
          subjectId: assignment.subjectId,
          score: examScore,
        },
      });

      // Calculate Grade (Test1 + Test2 + Exam)
      const totalScore = test1Score + test2Score + examScore;
      const percentage = (totalScore / 100) * 100;

      await prisma.grade.create({
        data: {
          studentId: student.id,
          subjectId: assignment.subjectId,
          score: totalScore,
        },
      });

      // Create Result record
      await prisma.result.create({
        data: {
          studentId: student.id,
          subjectId: assignment.subjectId,
          totalScore,
          average: percentage,
        },
      });
    }
  }

  // Create Announcements (reduced to 2)
  const announcements = await Promise.all([
    prisma.announcement.create({
      data: {
        title: "First Term Examination",
        content:
          "First term examination will commence on Monday, December 4th, 2024. All students should be present and punctual.",
      },
    }),
    prisma.announcement.create({
      data: {
        title: "Parent-Teacher Conference",
        content:
          "Parent-teacher conference is scheduled for Saturday, November 25th, 2024. All parents are invited to discuss their children's progress.",
      },
    }),
  ]);

  console.log("✅ Seed completed successfully!");

  // Summary
  console.log("\n📈 Database Summary:");
  console.log(
    `👤 Users created: ${studentData.length + teacherData.length + 1}`
  );
  console.log(`👨‍🏫 Teachers: ${teachers.length}`);
  console.log(`👨‍🎓 Students: ${students.length}`);
  console.log(`🏫 Classes: ${classes.length}`);
  console.log(`📚 Subjects: ${subjects.length}`);
  console.log(`🏢 Departments: ${departments.length}`);
  console.log(`📋 Teaching Assignments: ${teachingAssignments.length}`);
  console.log(`📅 Weeks: ${weeks.length}`);
  console.log(`📢 Announcements: ${announcements.length}`);
  console.log("\n🔐 Default Passwords:");
  console.log("Admin: admin123");
  console.log("Teachers: teacher123");
  console.log("Students: student123");
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
