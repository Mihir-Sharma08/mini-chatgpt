import { Router } from "express";
import { validateRegister, validateLogin } from "../middleware/validateAuth.js";
import { loginLimiter, registerLimiter } from "../middleware/rateLimiters.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { register, login, getMe } from "../controllers/authController.js";

const router = Router();

router.post("/register", registerLimiter, validateRegister, register);
router.post("/login", loginLimiter, validateLogin, login);
router.get("/me", requireAuth, getMe);

export default router;