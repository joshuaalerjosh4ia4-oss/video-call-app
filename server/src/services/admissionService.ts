import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorHandler";
import { randomInt } from "crypto";

const fees = { enrollment: 1500, other: 500 };

async function role(userId: string) {
  return (await prisma.user.findUnique({ where: { id: userId }, select: { role: true } }))?.role;
}

async function requireRole(userId: string, expected: "STUDENT" | "ADMIN") {
  if (await role(userId) !== expected) throw new HttpError(403, `Only ${expected.toLowerCase()} users can perform this action`);
}

export async function listSections(userId: string) {
  const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!currentUser) throw new HttpError(404, "User not found");
  return prisma.courseSection.findMany({
    where: currentUser.role === "TEACHER" ? { teacherId: userId } : undefined,
    select: {
      id: true,
      code: true,
      course: true,
      yearLevel: true,
      semester: true,
      teacherId: true,
      teacher: { select: { id: true, username: true } },
      subjects: {
        select: { id: true, code: true, title: true, units: true, dayOfWeek: true, startTime: true, endTime: true },
      },
    },
    orderBy: [{ course: "asc" }, { yearLevel: "asc" }],
  });
}

export async function createSection(userId: string, input: { code: string; course: string; yearLevel: number; semester: string; teacherId?: string; subjects: { code: string; title: string; units: number; dayOfWeek: number; startTime: string; endTime: string }[] }) {
  await requireRole(userId, "ADMIN");
  if (input.teacherId) {
    const teacher = await prisma.user.findUnique({ where: { id: input.teacherId }, select: { role: true } });
    if (teacher?.role !== "TEACHER") throw new HttpError(422, "Choose a valid teacher account");
  }
  return prisma.courseSection.create({
    data: {
      ...input,
      createdById: userId,
      subjects: {
        create: input.subjects,
      },
    },
    select: {
      id: true,
      code: true,
      course: true,
      yearLevel: true,
      semester: true,
      teacherId: true,
      teacher: { select: { id: true, username: true } },
      subjects: {
        select: { id: true, code: true, title: true, units: true, dayOfWeek: true, startTime: true, endTime: true },
      },
    },
  });
}

export async function assignSectionTeacher(adminId: string, sectionId: string, teacherId: string | null) {
  await requireRole(adminId, "ADMIN");
  if (teacherId) {
    const teacher = await prisma.user.findUnique({ where: { id: teacherId }, select: { role: true } });
    if (teacher?.role !== "TEACHER") throw new HttpError(422, "Choose a valid teacher account");
  }
  const section = await prisma.courseSection.findUnique({ where: { id: sectionId }, select: { id: true } });
  if (!section) throw new HttpError(404, "Course section not found");
  return prisma.courseSection.update({
    where: { id: sectionId },
    data: { teacherId },
    select: {
      id: true,
      code: true,
      course: true,
      teacherId: true,
      teacher: { select: { id: true, username: true } },
    },
  });
}

export async function getMyAdmission(studentId: string) {
  await requireRole(studentId, "STUDENT");
  const admission = await prisma.admission.findFirst({
    where: { studentId },
    include: admissionInclude,
    orderBy: { createdAt: "desc" },
  });
  return admission && exposePersonalJoinCodes(admission);
}

export async function submitAdmission(studentId: string, sectionId: string, subjectSelections: { subjectId: string; schedule: string }[]) {
  await requireRole(studentId, "STUDENT");
  const section = await prisma.courseSection.findUnique({ where: { id: sectionId }, include: { subjects: true } });
  if (!section) throw new HttpError(404, "Course section not found");
  if (!subjectSelections.length) throw new HttpError(422, "Select at least one subject");
  if (subjectSelections.some(({ subjectId, schedule }) => !section.subjects.some((subject) => subject.id === subjectId) || !["morning", "afternoon", "evening"].includes(schedule))) throw new HttpError(422, "Invalid subject or schedule");
  const existing = await prisma.admission.findFirst({ where: { studentId, status: { not: "REJECTED" } } });
  if (existing && existing.sectionId !== sectionId) throw new HttpError(409, "You can select only one course and section");
  const subjectFees = section.subjects.filter((subject) => subjectSelections.some(({ subjectId }) => subjectId === subject.id)).reduce((total, subject) => total + subject.units * 500, 0);
  const data = { sectionId, status: "SUBMITTED" as const, submittedAt: new Date(), enrollmentFee: fees.enrollment, subjectFees, otherFees: fees.other, totalFees: fees.enrollment + subjectFees + fees.other };
  const currentSelections = existing
    ? await prisma.admissionSubject.findMany({
        where: { admissionId: existing.id },
        select: { subjectId: true, joinCode: true },
      })
    : [];
  const existingCodes = new Map(currentSelections.map(({ subjectId, joinCode }) => [subjectId, joinCode]));
  const generatedCodes = await generateAdmissionJoinCodes(
    subjectSelections.filter(({ subjectId }) => !existingCodes.has(subjectId)).length
  );
  let nextCode = 0;
  const selections = subjectSelections.map(({ subjectId, schedule }) => ({
    subjectId,
    schedule,
    joinCode: existingCodes.get(subjectId) ?? generatedCodes[nextCode++],
  }));

  const admissionId = await prisma.$transaction(async (transaction) => {
    const admission = existing
      ? await transaction.admission.update({ where: { id: existing.id }, data })
      : await transaction.admission.create({ data: { studentId, ...data } });
    await transaction.admissionSubject.deleteMany({ where: { admissionId: admission.id } });
    await transaction.admissionSubject.createMany({
      data: selections.map((selection) => ({ ...selection, admissionId: admission.id })),
    });
    return admission.id;
  });

  const admission = await prisma.admission.findUniqueOrThrow({
    where: { id: admissionId },
    include: admissionInclude,
  });
  return exposePersonalJoinCodes(admission);
}

const admissionInclude = {
  section: {
    select: {
      id: true,
      code: true,
      course: true,
      yearLevel: true,
      semester: true,
      subjects: {
        select: { id: true, code: true, title: true, units: true, dayOfWeek: true, startTime: true, endTime: true },
      },
    },
  },
  subjects: {
    select: {
      admissionId: true,
      subjectId: true,
      joinCode: true,
      schedule: true,
      subject: {
        select: { id: true, code: true, title: true, units: true, dayOfWeek: true, startTime: true, endTime: true },
      },
    },
  },
} as const;

function exposePersonalJoinCodes<T extends { status: string; subjects: { joinCode: string; subject: object }[] }>(admission: T) {
  return {
    ...admission,
    subjects: admission.subjects.map(({ joinCode, subject, ...selection }) => ({
      ...selection,
      subject: { ...subject, joinCode: admission.status === "FINALIZED" ? joinCode : undefined },
    })),
  };
}

async function generateAdmissionJoinCodes(count: number): Promise<string[]> {
  if (count === 0) return [];

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidates = new Set<string>();
    while (candidates.size < count) candidates.add(randomInt(100_000, 1_000_000).toString());
    const existingCodes = await prisma.admissionSubject.findMany({
      where: { joinCode: { in: [...candidates] } },
      select: { joinCode: true },
    });
    if (existingCodes.length === 0) return [...candidates];
  }
  throw new HttpError(503, "Could not generate unique subject join codes. Please try again.");
}

export async function listAdmissions(adminId: string) {
  await requireRole(adminId, "ADMIN");
  return prisma.admission.findMany({
    include: {
      student: { select: { username: true, email: true } },
      section: { select: { id: true, code: true, course: true, yearLevel: true, semester: true } },
      subjects: {
        select: {
          admissionId: true,
          subjectId: true,
          joinCode: true,
          schedule: true,
          subject: {
            select: { id: true, code: true, title: true, units: true, dayOfWeek: true, startTime: true, endTime: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateAdmission(adminId: string, id: string, paymentStatus: "UNPAID" | "PAID", finalize: boolean) {
  await requireRole(adminId, "ADMIN");
  const admission = await prisma.admission.findUnique({ where: { id } });
  if (!admission) throw new HttpError(404, "Admission not found");
  if (finalize && paymentStatus !== "PAID") throw new HttpError(422, "Confirm payment before finalizing admission");
  return prisma.admission.update({ where: { id }, data: { paymentStatus, status: finalize ? "FINALIZED" : admission.status, finalizedAt: finalize ? new Date() : undefined, codesSentAt: finalize ? new Date() : undefined } });
}