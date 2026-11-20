import { AppError } from "../utils/AppError.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72;

function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateRegister(req, res, next) {
  const body = req.body ?? {};
  const errors = [];

  const username = asTrimmedString(body.username);
  const email = asTrimmedString(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (username.length < 3 || username.length > 30) {
    errors.push("username must be 3 to 30 characters");
  } else if (!USERNAME_PATTERN.test(username)) {
    errors.push("username may contain only letters, numbers and underscores");
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.push("email must be a valid email address");
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  } else if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    errors.push("password is too long (maximum 72 bytes)");
  }

  if (errors.length > 0) {
    return next(new AppError("Validation failed", 400, errors));
  }

  req.body = { username, email, password };
  next();
}

export function validateLogin(req, res, next) {
  const body = req.body ?? {};

  const email = asTrimmedString(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password || email.length > 254 || password.length > 128) {
    return next(new AppError("Validation failed", 400, ["email and password are required"]));
  }

  req.body = { email, password };
  next();
}