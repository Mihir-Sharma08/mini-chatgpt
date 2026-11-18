import { GoogleGenAI } from "@google/genai";
import { env } from "../src/config/env.js";

const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });

async function main() {
  console.log(`testing model :${env.geminiModel}\n`);

  const stream = await ai.models.generateContentStream({
    model: env.geminiModel,
    contents: "Explain what a token is in one short paragraph.",
  });

  for await (const chunk of stream) {
    if (chunk.text) process.stdout.write(chunk.text);
  }
  console.log("\n\nDone.");
}

main().catch((error) => {
  console.error("gemini test failes:", error.status ?? "", error.message);
  process.exit(1);
});
