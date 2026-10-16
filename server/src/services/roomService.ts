import { randomInt } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorHandler";

async function requireRole(userId: string, role: "STUDENT" | "TEACHER" | "ADMIN"): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== role) {
    throw new HttpError(403, `Only ${role.toLowerCase()} users can perform this action`);
  }
}

function generateRoomId(): string {
  return randomInt(100_000_000, 1_000_000_000).toString();
}

function generatePasscode(): string {
  return randomInt(100_000, 1_000_000).toString();
}

export async function createScheduledRoom(
  teacherId: string,
  input: { subjectId: string; startsAt: string; endsAt: string }
) {
  await requireRole(teacherId, "TEACHER");
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (startsAt <= new Date() || endsAt <= startsAt) {
    throw new HttpError(422, "Choose a future start time and an end time after it");
  }

  const subject = await prisma.subject.findUnique({
    where: { id: input.subjectId },
    select: { id: true, section: { select: { teacherId: true } } },
  });
  if (!subject) throw new HttpError(404, "Subject not found");
  if (subject.section.teacherId !== teacherId) {
    throw new HttpError(403, "You can schedule rooms only for subjects in sections assigned to you");
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.room.create({
        data: {
          id: generateRoomId(),
          passcode: generatePasscode(),
          ownerId: teacherId,
          subjectId: subject.id,
          startsAt,
          endsAt,
        },
        select: {
          id: true,
          passcode: true,
          startsAt: true,
          endsAt: true,
          subject: {
            select: {
              id: true,
              code: true,
              title: true,
              section: { select: { course: true, code: true } },
            },
          },
        },
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002" &&
        attempt < 2
      ) {
        continue;
      }
      throw error;
    }
  }
  throw new HttpError(503, "Could not allocate a unique room ID. Please try again.");
}

export async function listScheduledRooms(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) throw new HttpError(404, "User not found");

  const now = new Date();
  let where: Prisma.RoomWhereInput;
  if (user.role === "TEACHER") {
    where = { ownerId: userId, subjectId: { not: null }, endsAt: { gte: now } };
  } else if (user.role === "STUDENT") {
    const [enrollments, selectedSubjects] = await Promise.all([
      prisma.enrollment.findMany({ where: { studentId: userId }, select: { courseCode: true } }),
      prisma.admissionSubject.findMany({
        where: { admission: { studentId: userId, status: "FINALIZED" } },
        select: { subjectId: true, joinCode: true },
      }),
    ]);
    const codes = enrollments.map(({ courseCode }) => courseCode);
    const matches = selectedSubjects.filter(({ subjectId, joinCode }) =>
      codes.includes(subjectId) || codes.includes(joinCode)
    );
    const legacySubjects = codes.length
      ? await prisma.subject.findMany({
          where: { OR: [{ id: { in: codes } }, { code: { in: codes } }] },
          select: { id: true },
        })
      : [];
    const subjectIds = [...new Set([...matches.map(({ subjectId }) => subjectId), ...legacySubjects.map(({ id }) => id)])];
    if (!subjectIds.length) return [];
    where = { subjectId: { in: subjectIds }, endsAt: { gte: now } };
  } else {
    where = { subjectId: { not: null }, endsAt: { gte: now } };
  }

  return prisma.room.findMany({
    where,
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      passcode: true,
      startsAt: true,
      endsAt: true,
      subject: {
        select: {
          id: true,
          code: true,
          title: true,
          section: { select: { course: true, code: true } },
        },
      },
    },
  });
}
