import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";

export function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

// Express recognizes an error handler by its FOUR parameters.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";
  let details = err.details;

  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON in request body";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    details = Object.values(err.errors).map((e) => e.message);
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  } else if (err.code === 11000) {
    statusCode = 409;
    message = "A record with that value already exists";
  }

  const isProduction = env.nodeEnv === "production";

  if (statusCode >= 500) {
    console.error(err);
    if (isProduction) {
      message = "Internal server error";
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
    ...(!isProduction && statusCode >= 500 && { stack: err.stack }),
  });
}