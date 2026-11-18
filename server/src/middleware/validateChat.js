import { AppError } from "../utils/AppError.js";
import { isObjectIdString } from "./validateObjectId.js";

const MAX_MESSAGE_LENGTH = 8000;

export function validateChatRequest(req, res, next) {
  const { message, conversationId } = req.body ?? {};
  const errors = [];

  if (typeof message !== "string" || message.trim() === "") {
    errors.push("message must be a non-empty string");
  } else if (message.length > MAX_MESSAGE_LENGTH) {
    errors.push(`message must be at most ${MAX_MESSAGE_LENGTH} characters`);
  }

  if (conversationId !== undefined && conversationId !== null && !isObjectIdString(conversationId)) {
    errors.push("conversationId must be a valid ID");
  }

  if (errors.length > 0) {
    return next(new AppError("Validation failed", 400, errors));
  }

  req.body = {
    message: message.trim(),
    conversationId: conversationId ?? undefined,
  };
  next();
}