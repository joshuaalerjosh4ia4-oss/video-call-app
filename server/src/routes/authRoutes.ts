import { Router } from "express";
import {
	changePassword,
	changePasswordSchema,
	forgotPassword,
	emailSchema,
	login,
	loginSchema,
	me,
	register,
	registerSchema,
	resendVerification,
	verifyEmail,
	verifyEmailSchema,
} from "../controllers/authController";
import { validateBody } from "../middleware/validate";
import { authMiddleware } from "../middleware/auth";
import { authRateLimiter } from "../middleware/security";

const router = Router();

router.post("/register", authRateLimiter, validateBody(registerSchema), register);
router.post("/login", authRateLimiter, validateBody(loginSchema), login);
router.post("/forgot-password", authRateLimiter, validateBody(emailSchema), forgotPassword);
router.post("/change-password", authMiddleware, validateBody(changePasswordSchema), changePassword);
router.post("/verify-email/resend", authRateLimiter, validateBody(emailSchema), resendVerification);
router.post("/verify-email/confirm", authRateLimiter, validateBody(verifyEmailSchema), verifyEmail);
router.get("/me", authMiddleware, me);

export default router;
