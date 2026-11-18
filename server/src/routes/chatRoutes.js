import { Router } from "express";
import { validateChatRequest } from "../middleware/validateChat.js";
import { streamChat } from "../controllers/chatController.js";

const router = Router();

router.post("/stream", validateChatRequest, streamChat);

export default router;