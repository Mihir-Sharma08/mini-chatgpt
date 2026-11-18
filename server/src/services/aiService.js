import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

const SYSTEM_PROMPT = `You are Mini ChatGPT, a helpful and friendly assistant for learners and developers.
- Answer clearly and concisely.
- Use Markdown for formatting, and fenced code blocks with a language name for code.
- If you are not sure about something, say so instead of guessing.`;

function trimHistory(messages) {
  const recent = messages.slice(-env.maxHistoryMessages);
  while (recent.length > 0 && recent[0].role !== "user") {
    recent.shift();
  }
  return recent;
}

function toGeminiContents(messages) {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

function toAppError(error) {
  const status = error?.status;

  if (status === 429) {
    return new AppError(
      "The AI service is busy or the free-tier limit was reached. Please wait a minute and try again.",
      429,
    );
  }
  if (status === 404) {
    return new AppError("The configured AI model was not found. Check GEMINI_MODEL on the server.", 502);
  }
  if (status === 400 || status === 401 || status === 403) {
    return new AppError("The AI service rejected the request. Check the API key and model settings on the server.", 502);
  }
  if (status >= 500) {
    return new AppError("The AI service is temporarily unavailable. Please try again shortly.", 503);
  }
  return new AppError("Could not get a response from the AI service.", 502);
}

export async function* streamChatCompletion(messages) {
  const contents = toGeminiContents(trimHistory(messages));

  try {
    const stream = await ai.models.generateContentStream({
      model: env.geminiModel,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: env.aiTemperature,
        maxOutputTokens: env.maxOutputTokens,
      },
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("[aiService] Gemini request failed:", error?.status ?? "", error?.message);
    throw toAppError(error);
  }
}