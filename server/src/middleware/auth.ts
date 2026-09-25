import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";
import { sendError } from "../utils/response";

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    sendError(res, "Missing or invalid Authorization header", 401);
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    sendError(res, "Invalid or expired token", 401);
  }
}
