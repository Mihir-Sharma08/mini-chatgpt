import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { createEcho } from "../controllers/echoController.js";

const router = Router();

router.post(
  "/",
  validateBody({ message: { type: "string", required: true, maxLength: 200 } }),
  createEcho,
);

export default router;