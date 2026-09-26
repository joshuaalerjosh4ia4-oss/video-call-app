import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  changeTemporaryPassword,
  getCurrentUser,
  loginUser,
  registerUser,
  requestPasswordReset,
  resendVerificationCode,
  verifyEmailCode,
} from "../services/authService";
import { sendSuccess } from "../utils/response";

export const registerSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(30),
  email: z.string().trim().email("Invalid email address").max(254),
  password: z.string().min(12, "Password must be at least 12 characters").max(128),
  mobilePhone: z.string().trim().regex(/^9\d{9}$/, "Enter a 10-digit mobile number starting with 9"),
  age: z.number().int().min(1).max(120),
  sex: z.enum(["FEMALE", "MALE", "OTHER"]),
  blk: z.string().trim().max(50).optional().default(""),
  lot: z.string().trim().max(50).optional().default(""),
  street: z.string().trim().max(100).optional().default(""),
  villagePurok: z.string().trim().max(100).optional().default(""),
  barangay: z.string().trim().min(1, "Barangay is required").max(100),
  municipality: z.string().trim().min(1, "Municipality is required").max(100),
  region: z.string().trim().min(1, "Region is required").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(254),
  password: z.string().min(1, "Password is required").max(128),
});

export const emailSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(254),
});

export const verifyEmailSchema = emailSchema.extend({
  code: z.string().regex(/^\d{6}$/, "Verification code must be 6 digits"),
});

export const changePasswordSchema = z.object({
  newPassword: z.string().min(12, "Password must be at least 12 characters").max(128),
});

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await registerUser(req.body);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await loginUser(req.body);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await requestPasswordReset(req.body.email);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await changeTemporaryPassword(req.user!.userId, req.body.newPassword);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

export async function resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await resendVerificationCode(req.body.email);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await verifyEmailCode(req.body.email, req.body.code);
    sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await getCurrentUser(req.user!.userId);
    sendSuccess(res, user, 200);
  } catch (err) {
    next(err);
  }
}
