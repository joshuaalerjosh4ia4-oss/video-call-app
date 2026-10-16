import { Router } from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import enrollmentRoutes from "./enrollmentRoutes";
import admissionRoutes from "./admissionRoutes";
import roomRoutes from "./roomRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/admissions", admissionRoutes);
router.use("/rooms", roomRoutes);

export default router;
