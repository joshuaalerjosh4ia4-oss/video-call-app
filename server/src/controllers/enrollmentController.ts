import { NextFunction, Request, Response } from "express";
import { enrollStudent, listEnrollments, listSubjectPeople } from "../services/enrollmentService";
import { sendSuccess } from "../utils/response";

export async function getEnrollments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const enrollments = await listEnrollments(req.user!.userId);
    sendSuccess(res, enrollments);
  } catch (error) {
    next(error);
  }
}

export async function getSubjectPeople(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const people = await listSubjectPeople(req.user!.userId, req.params.subjectId);
    sendSuccess(res, people);
  } catch (error) {
    next(error);
  }
}

export async function postEnrollment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const enrollment = await enrollStudent(req.user!.userId, req.body.joinCode);
    sendSuccess(res, enrollment, 201);
  } catch (error) {
    next(error);
  }
}