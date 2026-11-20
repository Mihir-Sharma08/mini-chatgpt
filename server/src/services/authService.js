import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";

// A real hash of a throwaway password. If a login email doesn't exist we still run
// bcrypt.compare against this, so "unknown email" and "wrong password" take about the
// same time. That stops attackers from discovering which emails are registered.
const DUMMY_HASH = await bcrypt.hash("not-a-real-password", env.bcryptRounds);

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, {
    algorithm: "HS256",
    expiresIn: env.jwtExpiresIn,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
}

export async function registerUser({ username, email, password }) {
  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);

  try {
    const user = await User.create({ username, email, passwordHash });
    return { user, token: signToken(user._id) };
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError("An account with that email or username already exists", 409);
    }
    throw error;
  }
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select("+passwordHash");

  const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
  const passwordMatches = await bcrypt.compare(password, hashToCompare);

  if (!user || !passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  return { user, token: signToken(user._id) };
}