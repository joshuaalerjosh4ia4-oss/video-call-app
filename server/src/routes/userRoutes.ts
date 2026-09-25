import { Router } from "express";
import { listUsers, getUser } from "../controllers/userController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);
router.get("/", listUsers);
router.get("/:id", getUser);

export default router;
