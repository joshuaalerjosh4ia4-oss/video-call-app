import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";
import { sendError } from "../utils/response";
import { prisma } from "../config/prisma";

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    sendError(res, "Missing or invalid Authorization header", 401);
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    sendError(res, "Invalid or expired token", 401);
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { mustChangePassword: true },
    });
    if (!user) {
      sendError(res, "Invalid or expired token", 401);
      return;
    }

    const requestPath = req.originalUrl.split("?")[0];
    const isCurrentUserRequest = req.method === "GET" && requestPath.endsWith("/auth/me");
    const isPasswordChangeRequest = req.method === "POST" && requestPath.endsWith("/auth/change-password");
    if (user.mustChangePassword && !isCurrentUserRequest && !isPasswordChangeRequest) {
      sendError(res, "Change your temporary password before continuing", 403);
      return;
    }

    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}
