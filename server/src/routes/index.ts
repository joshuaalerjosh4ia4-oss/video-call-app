import { Router } from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import enrollmentRoutes from "./enrollmentRoutes";
import admissionRoutes from "./admissionRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/admissions", admissionRoutes);

export default router;
