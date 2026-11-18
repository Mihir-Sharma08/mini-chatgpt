import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import {
  getConversations,
  createConversation,
  getConversation,
  renameConversation,
  deleteConversation,
} from "../controllers/conversationController.js";

const router = Router();

const titleRules = { title: { type: "string", required: true, minLength: 1, maxLength: 80 } };

router.get("/", getConversations);
router.post("/", validateBody({ title: { type: "string", maxLength: 80 } }), createConversation);
router.get("/:id", validateObjectId("id"), getConversation);
router.patch("/:id", validateObjectId("id"), validateBody(titleRules), renameConversation);
router.delete("/:id", validateObjectId("id"), deleteConversation);

export default router;