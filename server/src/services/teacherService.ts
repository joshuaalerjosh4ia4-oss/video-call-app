import { randomBytes } from "crypto";
import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorHandler";
import { sendTemporaryPassword } from "./emailService";
import { hashPassword } from "../utils/password";

export async function createTeacherAccount(
  adminId: string,
  input: { username: string; email: string }
) {
  const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { role: true } });
  if (admin?.role !== "ADMIN") {
    throw new HttpError(403, "Only admins can create teacher accounts");
  }

  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  if (await prisma.user.findFirst({ where: { OR: [{ username }, { email }] }, select: { id: true } })) {
    throw new HttpError(409, "That username or email is already registered");
  }

  const temporaryPassword = randomBytes(24).toString("base64url");
  const teacher = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash: await hashPassword(temporaryPassword),
      role: "TEACHER",
      emailVerified: true,
      mustChangePassword: true,
    },
    select: { id: true, username: true, email: true },
  });

  try {
    await sendTemporaryPassword(email, temporaryPassword);
  } catch (error) {
    await prisma.user.delete({ where: { id: teacher.id } });
    throw error;
  }

  return { id: teacher.id, username: teacher.username, email: teacher.email };
}
