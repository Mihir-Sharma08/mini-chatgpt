import dotenv from "dotenv";

dotenv.config({ quiet: true });

const requiredVariables = [
  "MONGODB_URI",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "JWT_SECRET",
];

const missing = requiredVariables.filter((name) => !process.env[name]);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}`,
  );
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long");
}

const nodeEnv = process.env.NODE_ENV || "development";

if (nodeEnv === "production" && !process.env.CLIENT_URL) {
  throw new Error(
    "CLIENT_URL must be set in production (the URL of your deployed frontend)",
  );
}

const clientUrls = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

export const env = {
  nodeEnv,
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  clientUrls,
  trustProxy: Number(process.env.TRUST_PROXY) || 0,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL,
  aiTemperature: Number(process.env.AI_TEMPERATURE ?? 0.7),
  maxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS) || 2048,
  maxHistoryMessages: Number(process.env.AI_MAX_HISTORY_MESSAGES) || 20,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
};
