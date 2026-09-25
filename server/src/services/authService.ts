import { prisma } from "../config/prisma";
import { hashPassword, verifyPassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { HttpError } from "../middleware/errorHandler";

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
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
  };
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existingByEmail = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingByEmail) {
    throw new HttpError(409, "Email is already registered");
  }

  const existingByUsername = await prisma.user.findUnique({ where: { username: input.username } });
  if (existingByUsername) {
    throw new HttpError(409, "Username is already taken");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      username: input.username,
      email: input.email,
      passwordHash,
    },
  });

  const token = signToken({ userId: user.id, username: user.username });

  return {
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
  };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  const isValid = await verifyPassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new HttpError(401, "Invalid email or password");
  }

  const token = signToken({ userId: user.id, username: user.username });

  return {
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  return { id: user.id, username: user.username, email: user.email, role: user.role, createdAt: user.createdAt };
}
