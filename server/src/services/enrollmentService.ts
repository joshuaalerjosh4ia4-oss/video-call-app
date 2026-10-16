import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorHandler";

const enrolledSubjectSelection = {
  id: true,
  code: true,
  title: true,
  dayOfWeek: true,
  startTime: true,
  endTime: true,
  section: { select: { course: true, code: true } },
} as const;

async function requireStudent(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "STUDENT") {
    throw new HttpError(403, "Only students can enroll in subjects");
  }
}

export async function listEnrollments(studentId: string) {
  await requireStudent(studentId);
  const [enrollments, admissionSubjects] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      select: { id: true, courseCode: true, createdAt: true },
    }),
    prisma.admissionSubject.findMany({
      where: { admission: { studentId, status: "FINALIZED" } },
      select: { joinCode: true, subject: { select: enrolledSubjectSelection } },
    }),
  ]);

  const legacyCodes = [...new Set(enrollments.map(({ courseCode }) => courseCode))];
  const legacySubjects = legacyCodes.length > 0
    ? await prisma.subject.findMany({
        where: {
          OR: [
            { id: { in: legacyCodes } },
            { code: { in: legacyCodes } },
          ],
        },
        select: enrolledSubjectSelection,
      })
    : [];

  return enrollments.map((enrollment) => {
    const personalSelection = admissionSubjects.find(({ joinCode, subject }) =>
      joinCode === enrollment.courseCode ||
      subject.id === enrollment.courseCode ||
      subject.code === enrollment.courseCode
    );
    const legacyMatches = legacySubjects.filter((subject) =>
      subject.id === enrollment.courseCode ||
      subject.code === enrollment.courseCode
    );
    const subject = personalSelection?.subject ?? (legacyMatches.length === 1 ? legacyMatches[0] : null);
    const personalCode = personalSelection?.joinCode;

    return {
      ...enrollment,
      courseCode: personalCode ?? subject?.code ?? enrollment.courseCode,
      subject: subject ? {
        id: subject.id,
        code: subject.code,
        title: subject.title,
        dayOfWeek: subject.dayOfWeek,
        startTime: subject.startTime,
        endTime: subject.endTime,
        section: subject.section,
        joinCode: personalCode ?? "",
      } : null,
    };
  });
}

export async function listSubjectPeople(studentId: string, subjectId: string) {
  await requireStudent(studentId);
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: {
      id: true,
      admissions: {
        where: { admission: { status: "FINALIZED" } },
        select: { joinCode: true },
      },
    },
  });
  if (!subject) {
    throw new HttpError(404, "Subject not found");
  }

  const courseCodes = [subject.id, ...subject.admissions.map(({ joinCode }) => joinCode)];
  const requesterEnrollment = await prisma.enrollment.findFirst({
    where: { studentId, courseCode: { in: courseCodes } },
    select: { id: true },
  });
  if (!requesterEnrollment) {
    throw new HttpError(403, "You must be enrolled in this subject to view its people");
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseCode: { in: courseCodes },
      student: { role: "STUDENT" },
    },
    select: { student: { select: { id: true, username: true } } },
  });

  return enrollments
    .map(({ student }) => student)
    .sort((first, second) => first.username.localeCompare(second.username));
}

export async function enrollStudent(studentId: string, joinCodeInput: string) {
  await requireStudent(studentId);
  const joinCode = joinCodeInput.trim();
  const selection = await prisma.admissionSubject.findFirst({
    where: { joinCode, admission: { studentId, status: "FINALIZED" } },
    select: { subject: { select: enrolledSubjectSelection } },
  });
  if (!selection) {
    throw new HttpError(404, "Join code not found for this student. Check your personal 6-digit code and try again.");
  }

  try {
    const enrollment = await prisma.enrollment.create({
      data: { studentId, courseCode: selection.subject.id },
      select: { id: true, courseCode: true, createdAt: true },
    });
    return {
      ...enrollment,
      courseCode: joinCode,
      subject: { ...selection.subject, joinCode },
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("enrollments_studentId_courseCode_key")) {
      throw new HttpError(409, "You are already enrolled in this subject");
    }
    throw error;
  }
}