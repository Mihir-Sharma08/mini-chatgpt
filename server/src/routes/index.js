import { Router } from "express";
import healthRoutes from "./healthRoutes.js";
import chatRoutes from "./chatRoutes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/chat", chatRoutes);

export default router;