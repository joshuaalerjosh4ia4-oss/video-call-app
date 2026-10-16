import { Router } from "express";
import { z } from "zod";
import { createScheduledRoom, listScheduledRooms } from "../controllers/roomController";
import { authMiddleware } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();
router.use(authMiddleware);

router.get("/", listScheduledRooms);
router.post(
  "/",
  validateBody(z.object({
    subjectId: z.string().uuid(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
  }).refine((room) => new Date(room.endsAt) > new Date(room.startsAt), "End time must be after start time")),
  createScheduledRoom
);

export default router;
