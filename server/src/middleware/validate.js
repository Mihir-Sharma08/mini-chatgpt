import { AppError } from "../utils/AppError.js";

export function validateBody(rules) {
  return (req, res, next) => {
    const body = req.body ?? {};
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
      let value = body[field];

      if (typeof value === "string") {
        value = value.trim();
      }

      const isEmpty = value === undefined || value === null || value === "";

      if (isEmpty) {
        if (rule.required) {
          errors.push(`${field} is required`);
        }
        continue;
      }

      if (rule.type && typeof value !== rule.type) {
        errors.push(`${field} must be a ${rule.type}`);
        continue;
      }

      if (rule.type === "string") {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${field} must be at least ${rule.minLength} characters`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${field} must be at most ${rule.maxLength} characters`);
        }
      }

      body[field] = value;
    }

    if (errors.length > 0) {
      return next(new AppError("Validation failed", 400, errors));
    }

    req.body = body;
    next();
  };
}