import { AppError } from "../utils/AppError.js";

const ALLOWED_ROLES = ["user", "assistant"];
const MAX_MESSAGES = 100;
const MAX_CONTENT_LENGTH = 8000;

export function validateChatRequest(req, res, next) {
  const messages = req.body?.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return next(new AppError("Validation failed", 400, ["messages must be a non-empty array"]));
  }

  const errors = [];

  if (messages.length > MAX_MESSAGES) {
    errors.push(`messages must contain at most ${MAX_MESSAGES} items`);
  }

  messages.forEach((message, index) => {
    if (!message || typeof message !== "object") {
      errors.push(`messages[${index}] must be an object`);
      return;
    }
    if (!ALLOWED_ROLES.includes(message.role)) {
      errors.push(`messages[${index}].role must be "user" or "assistant"`);
    }
    if (typeof message.content !== "string" || message.content.trim() === "") {
      errors.push(`messages[${index}].content must be a non-empty string`);
    } else if (message.content.length > MAX_CONTENT_LENGTH) {
      errors.push(`messages[${index}].content must be at most ${MAX_CONTENT_LENGTH} characters`);
    }
  });

  if (messages[messages.length - 1]?.role !== "user") {
    errors.push("the last message must be from the user");
  }

  if (errors.length > 0) {
    return next(new AppError("Validation failed", 400, errors));
  }

  req.body.messages = messages.map((message) => ({
    role: message.role,
    content: message.content.trim(),
  }));

  next();
}