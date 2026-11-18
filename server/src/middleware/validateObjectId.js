import { AppError } from "../utils/AppError.js";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export function isObjectIdString(value) {
  return typeof value === "string" && OBJECT_ID_PATTERN.test(value);
}

export function validateObjectId(paramName = "id") {
  return (req, res, next) => {
    if (!isObjectIdString(req.params[paramName])) {
      return next(new AppError("Invalid ID format", 400));
    }
    next();
  };
}