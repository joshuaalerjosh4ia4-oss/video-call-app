import { NextFunction, Request, Response } from "express";
import { createScheduledRoom as createRoom, listScheduledRooms as listRooms } from "../services/roomService";
import { sendSuccess } from "../utils/response";

export async function listScheduledRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await listRooms(req.user!.userId));
  } catch (error) {
    next(error);
  }
}

export async function createScheduledRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await createRoom(req.user!.userId, req.body), 201);
  } catch (error) {
    next(error);
  }
}
