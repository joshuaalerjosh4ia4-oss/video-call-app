import { Router } from "express";
import { z } from "zod";
import { adminList, adminUpdate, create, mine, sections, submit } from "../controllers/admissionController";
import { authMiddleware } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = Router();
router.use(authMiddleware);
router.get("/sections", sections);
const sectionSchema = z.object({
	code: z.string().trim().min(1),
	course: z.string().trim().min(1),
	yearLevel: z.number().int().min(1).max(8),
	semester: z.string().trim().min(1),
	subjects: z.array(z.object({
		code: z.string().trim().min(1),
		title: z.string().trim().min(1),
		units: z.number().int().min(1).max(6),
		dayOfWeek: z.number().int().min(1).max(7),
		startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
		endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
	})).min(1),
}).refine((input) => input.subjects.every((subject) => subject.startTime < subject.endTime), "Each subject must end after it starts");

router.post("/sections", validateBody(sectionSchema), create);
router.get("/mine", mine);
router.post("/submit", validateBody(z.object({ sectionId: z.string().uuid(), subjectSelections: z.array(z.object({ subjectId: z.string().uuid(), schedule: z.enum(["morning", "afternoon", "evening"]) })).min(1) })), submit);
router.get("/admin", adminList);
router.patch("/admin/:id", validateBody(z.object({ paymentStatus: z.enum(["UNPAID", "PAID"]), finalize: z.boolean() })), adminUpdate);
export default router;