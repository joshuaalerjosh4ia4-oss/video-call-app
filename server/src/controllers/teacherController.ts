import { NextFunction, Request, Response } from "express";
import { createTeacherAccount as createAccount } from "../services/teacherService";
import { sendSuccess } from "../utils/response";

export async function createTeacherAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await createAccount(req.user!.userId, req.body), 201);
  } catch (error) {
    next(error);
  }
}
