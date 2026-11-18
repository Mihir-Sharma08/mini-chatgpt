import dotenv from "dotenv";

dotenv.config({ quiet: true });

const requiredVariables = ["MONGODB_URI", "GEMINI_API_KEY", "GEMINI_MODEL"];

const missing = requiredVariables.filter((name) => !process.env[name]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL,
  aiTemperature: Number(process.env.AI_TEMPERATURE ?? 0.7),
  maxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS) || 2048,
  maxHistoryMessages: Number(process.env.AI_MAX_HISTORY_MESSAGES) || 20,
};