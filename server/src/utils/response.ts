import { Response } from "express";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(statusCode).json(body);
}

export function sendError(res: Response, message: string, statusCode = 400): void {
  const body: ApiError = { success: false, message };
  res.status(statusCode).json(body);
}
