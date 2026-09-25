import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorHandler";

const fees = { enrollment: 1500, other: 500 };

async function role(userId: string) {
  return (await prisma.user.findUnique({ where: { id: userId }, select: { role: true } }))?.role;
}

async function requireRole(userId: string, expected: "STUDENT" | "ADMIN") {
  if (await role(userId) !== expected) throw new HttpError(403, `Only ${expected.toLowerCase()} users can perform this action`);
}

export async function listSections() {
  return prisma.courseSection.findMany({ include: { subjects: true }, orderBy: [{ course: "asc" }, { yearLevel: "asc" }] });
}

export async function createSection(userId: string, input: { code: string; course: string; yearLevel: number; semester: string; subjects: { code: string; title: string; units: number; dayOfWeek: number; startTime: string; endTime: string }[] }) {
  await requireRole(userId, "ADMIN");
  return prisma.courseSection.create({ data: { ...input, createdById: userId, subjects: { create: input.subjects } }, include: { subjects: true } });
}

export async function getMyAdmission(studentId: string) {
  await requireRole(studentId, "STUDENT");
  return prisma.admission.findFirst({ where: { studentId }, include: { section: { include: { subjects: true } }, subjects: { include: { subject: true } } }, orderBy: { createdAt: "desc" } });
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
  const admissionId = existing
    ? (await prisma.admission.update({ where: { id: existing.id }, data })).id
    : (await prisma.admission.create({ data: { studentId, ...data, subjects: { create: subjectSelections.map(({ subjectId, schedule }) => ({ subjectId, schedule })) } } })).id;

  if (existing) {
    await prisma.admissionSubject.deleteMany({ where: { admissionId } });
    await prisma.admissionSubject.createMany({ data: subjectSelections.map(({ subjectId, schedule }) => ({ admissionId, subjectId, schedule })) });
  }

  return prisma.admission.findUniqueOrThrow({
    where: { id: admissionId },
    include: { section: { include: { subjects: true } }, subjects: { include: { subject: true } } },
  });
}

export async function listAdmissions(adminId: string) {
  await requireRole(adminId, "ADMIN");
  return prisma.admission.findMany({ include: { student: { select: { username: true, email: true } }, section: true, subjects: { include: { subject: true } } }, orderBy: { createdAt: "desc" } });
}

export async function updateAdmission(adminId: string, id: string, paymentStatus: "UNPAID" | "PAID", finalize: boolean) {
  await requireRole(adminId, "ADMIN");
  const admission = await prisma.admission.findUnique({ where: { id } });
  if (!admission) throw new HttpError(404, "Admission not found");
  if (finalize && paymentStatus !== "PAID") throw new HttpError(422, "Confirm payment before finalizing admission");
  return prisma.admission.update({ where: { id }, data: { paymentStatus, status: finalize ? "FINALIZED" : admission.status, finalizedAt: finalize ? new Date() : undefined, codesSentAt: finalize ? new Date() : undefined } });
}