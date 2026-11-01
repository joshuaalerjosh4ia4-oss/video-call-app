import { NextFunction, Request, Response } from "express";
import { enrollStudent, listEnrollments, listSubjectPeople, listSubjectPosts, listUpcomingWork } from "../services/enrollmentService";
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

export async function getSubjectPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const posts = await listSubjectPosts(req.user!.userId, req.params.subjectId);
    sendSuccess(res, posts);
  } catch (error) {
    next(error);
  }
}

export async function getUpcomingWork(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const work = await listUpcomingWork(req.user!.userId);
    sendSuccess(res, work);
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