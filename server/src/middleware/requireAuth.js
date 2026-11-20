import User from "../models/User.js";
import { verifyToken } from "../services/authService.js";
import { AppError } from "../utils/AppError.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError("Authentication required", 401);
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Your session has expired. Please log in again."
        : "Invalid authentication token";
    throw new AppError(message, 401);
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw new AppError("Invalid authentication token", 401);
  }

  req.user = user;
  next();
}