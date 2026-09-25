import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorHandler";

function normalizeCourseCode(courseCode: string): string {
  return courseCode.trim().toUpperCase();
}

async function requireStudent(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "STUDENT") {
    throw new HttpError(403, "Only students can enroll in subjects");
  }
}

export async function listEnrollments(studentId: string) {
  await requireStudent(studentId);
  return prisma.enrollment.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    select: { id: true, courseCode: true, createdAt: true },
  });
}

export async function enrollStudent(studentId: string, courseCode: string) {
  await requireStudent(studentId);
  const normalizedCourseCode = normalizeCourseCode(courseCode);

  try {
    return await prisma.enrollment.create({
      data: { studentId, courseCode: normalizedCourseCode },
      select: { id: true, courseCode: true, createdAt: true },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("enrollments_studentId_courseCode_key")) {
      throw new HttpError(409, "You are already enrolled in this course");
    }
    throw error;
  }
}