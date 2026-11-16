import { Router } from "express";
import healthRoutes from "./healthRoutes.js";
import echoRoutes from "./echoRoutes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/echo", echoRoutes);

export default router;