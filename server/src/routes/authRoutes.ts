import { Router } from "express";
import { register, login, me, registerSchema, loginSchema } from "../controllers/authController";
import { validateBody } from "../middleware/validate";
import { authMiddleware } from "../middleware/auth";
import { authRateLimiter } from "../middleware/security";

const router = Router();

router.post("/register", authRateLimiter, validateBody(registerSchema), register);
router.post("/login", authRateLimiter, validateBody(loginSchema), login);
router.get("/me", authMiddleware, me);

export default router;
