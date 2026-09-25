import { Router } from "express";
import { z } from "zod";
import { getEnrollments, postEnrollment } from "../controllers/enrollmentController";
import { authMiddleware } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

router.use(authMiddleware);
router.get("/", getEnrollments);
router.post(
  "/",
  validateBody(z.object({ courseCode: z.string().trim().min(1).max(40) })),
  postEnrollment
);

export default router;