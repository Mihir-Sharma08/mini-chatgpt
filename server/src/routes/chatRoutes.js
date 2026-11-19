import { Router } from "express";
import { validateChatRequest, validateRegenerateRequest } from "../middleware/validateChat.js";
import { streamChat, regenerateChat } from "../controllers/chatController.js";

const router = Router();

router.post("/stream", validateChatRequest, streamChat);
router.post("/regenerate", validateRegenerateRequest, regenerateChat);

export default router;