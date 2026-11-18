import { Router } from "express";
import healthRoutes from "./healthRoutes.js";
import conversationRoutes from "./conversationRoutes.js";
import chatRoutes from "./chatRoutes.js";
import { attachDemoUser } from "../middleware/attachDemoUser.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/conversations", attachDemoUser, conversationRoutes);
router.use("/chat", attachDemoUser, chatRoutes);

export default router;