import { rateLimit } from "express-rate-limit";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";

const shouldSkip = () =>
  env.nodeEnv !== "production" && process.env.SKIP_RATE_LIMITS === "true";

function createLimiter({
  windowMs,
  limit,
  message,
  keyGenerator,
  skipSuccessfulRequests = false,
}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests,
    skip: shouldSkip,
    ...(keyGenerator && { keyGenerator }),
    handler: (req, res, next) => next(new AppError(message, 429)),
  });
}

// General protection for the whole API (per IP address).
export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: "Too many requests. Please slow down and try again later.",
});

// Brute-force protection: only FAILED logins count.
export const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: "Too many login attempts. Please try again in 15 minutes.",
});

// Stops mass account creation from one network.
export const registerLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message:
    "Too many accounts created from this network. Please try again later.",
});

// Protects our AI quota: limits per LOGGED-IN USER, not per IP.
export const chatLimiter = createLimiter({
  windowMs: 60 * 1000,
  limit: 15,
  keyGenerator: (req) => String(req.user._id),
  message: "You are sending messages too quickly. Please wait a moment.",
});
