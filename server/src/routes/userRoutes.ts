import { Router } from "express";
import { listUsers, getUser, getTeachers } from "../controllers/userController";
import { createTeacherAccount } from "../controllers/teacherController";
import { authMiddleware } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { z } from "zod";

const router = Router();

router.use(authMiddleware);
router.post("/teachers", validateBody(z.object({
  username: z.string().trim().min(3).max(30),
  email: z.string().trim().email().max(254),
})), createTeacherAccount);
router.get("/teachers", getTeachers);
router.get("/", listUsers);
router.get("/:id", getUser);

export default router;
