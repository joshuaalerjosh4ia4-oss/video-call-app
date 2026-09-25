import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { registerUser, loginUser, getCurrentUser } from "../services/authService";
import { sendSuccess } from "../utils/response";

export const registerSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(30),
  email: z.string().trim().email("Invalid email address").max(254),
  password: z.string().min(12, "Password must be at least 12 characters").max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(254),
  password: z.string().min(1, "Password is required").max(128),
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

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await getCurrentUser(req.user!.userId);
    sendSuccess(res, user, 200);
  } catch (err) {
    next(err);
  }
}
