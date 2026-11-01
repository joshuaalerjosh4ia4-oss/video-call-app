import { Router } from "express";
import { z } from "zod";
import { getEnrollments, getSubjectPeople, getSubjectPosts, getUpcomingWork, postEnrollment } from "../controllers/enrollmentController";
import { authMiddleware } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();

router.use(authMiddleware);
router.get("/", getEnrollments);
router.get("/upcoming-work", getUpcomingWork);
router.get("/:subjectId/people", getSubjectPeople);
router.get("/:subjectId/posts", getSubjectPosts);
router.post(
  "/",
  validateBody(z.object({ joinCode: z.string().trim().regex(/^\d{6}$/, "Join code must be 6 digits") })),
  postEnrollment
);

export default router;