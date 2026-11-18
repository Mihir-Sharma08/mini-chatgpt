import { streamChatCompletion } from "../services/aiService.js";
import { openSSE, sendSSE } from "../utils/sse.js";
import { AppError } from "../utils/AppError.js";

export async function streamChat(req, res) {
  const { messages } = req.body;

  let clientDisconnected = false;
  res.on("close", () => {
    clientDisconnected = true;
  });

  const stream = streamChatCompletion(messages);

  // Pull the FIRST chunk before opening the SSE stream. If the AI fails right away
  // (rate limit, bad key...), headers aren't sent yet, so we can still return a
  // proper HTTP status code through the central error handler.
  const first = await stream.next();

  if (first.done) {
    throw new AppError("The AI returned an empty response. Try rephrasing your message.", 502);
  }

  openSSE(res);

  try {
    let result = first;

    while (!result.done) {
      if (clientDisconnected) {
        await stream.return();
        return;
      }
      sendSSE(res, "token", { text: result.value });
      result = await stream.next();
    }

    sendSSE(res, "done", {});
  } catch (error) {
    // Too late for a status code (headers already sent), so we send an error EVENT.
    const message =
      error instanceof AppError ? error.message : "Something went wrong while generating the response.";
    sendSSE(res, "error", { message });
  } finally {
    res.end();
  }
}