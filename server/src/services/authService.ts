import { createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { prisma } from "../config/prisma";
import { hashPassword, verifyPassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { HttpError } from "../middleware/errorHandler";
import { env } from "../config/env";
import { sendTemporaryPassword, sendVerificationCode } from "./emailService";
import { getConnection } from "../websocket/presence";

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  mobilePhone: string;
  age: number;
  sex: "FEMALE" | "MALE" | "OTHER";
  blk: string;
  lot: string;
  street: string;
  villagePurok: string;
  barangay: string;
  municipality: string;
  region: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: "STUDENT" | "TEACHER" | "ADMIN";
    mustChangePassword: boolean;
    mobilePhone: string | null;
    age: number | null;
    sex: "FEMALE" | "MALE" | "OTHER" | null;
    blk: string | null;
    lot: string | null;
    street: string | null;
    villagePurok: string | null;
    barangay: string | null;
    municipality: string | null;
    region: string | null;
  };
}

const verificationCodeLifetimeMs = 10 * 60 * 1000;
const maximumVerificationAttempts = 5;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashVerificationCode(userId: string, code: string): string {
  return createHmac("sha256", env.jwtSecret).update(`${userId}:${code}`).digest("hex");
}

function registrationProfile(input: RegisterInput) {
  return {
    mobilePhone: input.mobilePhone,
    age: input.age,
    sex: input.sex,
    blk: input.blk || null,
    lot: input.lot || null,
    street: input.street || null,
    villagePurok: input.villagePurok || null,
    barangay: input.barangay,
    municipality: input.municipality,
    region: input.region,
  };
}

async function issueVerificationCode(userId: string, email: string): Promise<void> {
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await prisma.emailVerificationCode.upsert({
    where: { userId },
    create: {
      userId,
      codeHash: hashVerificationCode(userId, code),
      expiresAt: new Date(Date.now() + verificationCodeLifetimeMs),
    },
    update: {
      codeHash: hashVerificationCode(userId, code),
      expiresAt: new Date(Date.now() + verificationCodeLifetimeMs),
      attempts: 0,
    },
  });
  await sendVerificationCode(email, code);
}

export async function registerUser(input: RegisterInput): Promise<{ email: string; verificationRequired: true }> {
  const email = normalizeEmail(input.email);
  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail) {
    const canRetryPendingRegistration =
      !existingByEmail.emailVerified &&
      existingByEmail.username === input.username &&
      (await verifyPassword(input.password, existingByEmail.passwordHash));
    if (!canRetryPendingRegistration) {
      throw new HttpError(409, "Email is already registered");
    }
    await prisma.user.update({
      where: { id: existingByEmail.id },
      data: registrationProfile(input),
    });
    await issueVerificationCode(existingByEmail.id, existingByEmail.email);
    return { email: existingByEmail.email, verificationRequired: true };
  }

  const existingByUsername = await prisma.user.findUnique({ where: { username: input.username } });
  if (existingByUsername) {
    throw new HttpError(409, "Username is already taken");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      username: input.username,
      email,
      passwordHash,
      ...registrationProfile(input),
    },
  });

  await issueVerificationCode(user.id, user.email);
  return { email: user.email, verificationRequired: true };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(input.email) } });
  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  const isValid = await verifyPassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new HttpError(401, "Invalid email or password");
  }

  if (!user.emailVerified) {
    throw new HttpError(403, "Please verify your email before signing in");
  }

  const token = signToken({ userId: user.id, username: user.username });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      mobilePhone: user.mobilePhone,
      age: user.age,
      sex: user.sex,
      blk: user.blk,
      lot: user.lot,
      street: user.street,
      villagePurok: user.villagePurok,
      barangay: user.barangay,
      municipality: user.municipality,
      region: user.region,
    },
  };
}

export async function requestPasswordReset(emailInput: string): Promise<{ message: string }> {
  const email = normalizeEmail(emailInput);
  const user = await prisma.user.findUnique({ where: { email } });
  if (user?.emailVerified) {
    const temporaryPassword = randomBytes(18).toString("base64url");
    const passwordHash = await hashPassword(temporaryPassword);
    await sendTemporaryPassword(user.email, temporaryPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: true },
    });
    getConnection(user.id)?.close(4001, "Password reset required");
  }
  return { message: "If the email belongs to a verified account, a temporary password has been sent." };
}

export async function changeTemporaryPassword(userId: string, newPassword: string): Promise<{ changed: true }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  if (!user.mustChangePassword) {
    throw new HttpError(400, "No temporary password change is required");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: false },
  });
  return { changed: true };
}

export async function resendVerificationCode(emailInput: string): Promise<{ message: string }> {
  const email = normalizeEmail(emailInput);
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.emailVerified) {
    await issueVerificationCode(user.id, user.email);
  }
  return { message: "If the account needs verification, a new code has been sent." };
}

export async function verifyEmailCode(emailInput: string, code: string): Promise<{ verified: true }> {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(emailInput) } });
  if (!user) {
    throw new HttpError(400, "Invalid or expired verification code");
  }
  if (user.emailVerified) {
    return { verified: true };
  }

  const verification = await prisma.emailVerificationCode.findUnique({ where: { userId: user.id } });
  if (!verification || verification.expiresAt.getTime() <= Date.now()) {
    if (verification) {
      await prisma.emailVerificationCode.delete({ where: { userId: user.id } });
    }
    throw new HttpError(400, "Invalid or expired verification code");
  }
  if (verification.attempts >= maximumVerificationAttempts) {
    throw new HttpError(429, "Too many attempts. Request a new verification code.");
  }

  const expectedHash = Buffer.from(verification.codeHash, "hex");
  const submittedHash = Buffer.from(hashVerificationCode(user.id, code), "hex");
  if (!timingSafeEqual(expectedHash, submittedHash)) {
    const attempts = verification.attempts + 1;
    if (attempts >= maximumVerificationAttempts) {
      await prisma.emailVerificationCode.delete({ where: { userId: user.id } });
      throw new HttpError(429, "Too many attempts. Request a new verification code.");
    }
    await prisma.emailVerificationCode.update({ where: { userId: user.id }, data: { attempts } });
    throw new HttpError(400, "Invalid or expired verification code");
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } }),
    prisma.emailVerificationCode.delete({ where: { userId: user.id } }),
  ]);
  return { verified: true };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    mobilePhone: user.mobilePhone,
    age: user.age,
    sex: user.sex,
    blk: user.blk,
    lot: user.lot,
    street: user.street,
    villagePurok: user.villagePurok,
    barangay: user.barangay,
    municipality: user.municipality,
    region: user.region,
    createdAt: user.createdAt,
  };
}
