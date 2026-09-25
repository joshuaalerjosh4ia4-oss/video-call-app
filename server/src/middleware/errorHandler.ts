import { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/response";

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  console.error("Unhandled error:", err);
  sendError(res, "Internal server error", 500);
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Route not found: ${req.method} ${req.path}`, 404);
}
