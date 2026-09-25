import { NextFunction, Request, Response } from "express";
import { enrollStudent, listEnrollments } from "../services/enrollmentService";
import { sendSuccess } from "../utils/response";

export async function getEnrollments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const enrollments = await listEnrollments(req.user!.userId);
    sendSuccess(res, enrollments);
  } catch (error) {
    next(error);
  }
}

export async function postEnrollment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const enrollment = await enrollStudent(req.user!.userId, req.body.courseCode);
    sendSuccess(res, enrollment, 201);
  } catch (error) {
    next(error);
  }
}