import { Request, Response, NextFunction } from "express";
import { listUsersExcept, getUserById } from "../services/userService";
import { sendSuccess } from "../utils/response";

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await listUsersExcept(req.user!.userId);
    sendSuccess(res, users, 200);
  } catch (err) {
    next(err);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await getUserById(req.params.id);
    sendSuccess(res, user, 200);
  } catch (err) {
    next(err);
  }
}
