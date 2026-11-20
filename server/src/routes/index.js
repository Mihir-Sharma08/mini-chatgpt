import { Router } from "express";
import healthRoutes from "./healthRoutes.js";
import authRoutes from "./authRoutes.js";
import conversationRoutes from "./conversationRoutes.js";
import chatRoutes from "./chatRoutes.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { apiLimiter, chatLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.use("/health", healthRoutes);

router.use(apiLimiter);

router.use("/auth", authRoutes);
router.use("/conversations", requireAuth, conversationRoutes);
router.use("/chat", requireAuth, chatLimiter, chatRoutes);

export default router;