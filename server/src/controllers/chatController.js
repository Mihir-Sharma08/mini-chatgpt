import { streamChatCompletion } from "../services/aiService.js";
import * as conversationService from "../services/conversationService.js";
import { openSSE, sendSSE } from "../utils/sse.js";
import { AppError } from "../utils/AppError.js";

async function saveAssistantMessage(conversationId, text) {
  if (!text.trim()) return null;

  try {
    return await conversationService.addMessage(conversationId, "assistant", text);
  } catch (error) {
    console.error("[chat] Failed to save assistant message:", error.message);
    return null;
  }
}

export async function streamChat(req, res) {
  const userId = req.user._id;
  const { message, conversationId } = req.body;

  let clientDisconnected = false;
  res.on("close", () => {
    clientDisconnected = true;
  });

  // 1. Load context. For an existing chat, verify ownership and fetch recent history.
  let conversation = null;
  let history = [];

  if (conversationId) {
    conversation = await conversationService.getOwnedConversation(userId, conversationId);
    history = await conversationService.getHistoryForModel(conversation._id);
  }

  // 2. Ask the AI, and wait for the FIRST chunk before saving anything.
  const stream = streamChatCompletion([...history, { role: "user", content: message }]);
  const first = await stream.next();

  if (first.done) {
    throw new AppError("The AI returned an empty response. Try rephrasing your message.", 502);
  }

  // 3. The AI works, so now persist: create the chat if needed, then save the user message.
  if (!conversation) {
    conversation = await conversationService.createConversation(
      userId,
      conversationService.makeTitleFromMessage(message),
    );
  }
  await conversationService.addMessage(conversation._id, "user", message);

  // 4. Stream the reply to the browser while collecting it.
  openSSE(res);
  sendSSE(res, "meta", { conversationId: conversation.id, title: conversation.title });

  let fullText = "";
  let streamError = null;

  try {
    let result = first;

    while (!result.done && !clientDisconnected) {
      fullText += result.value;
      sendSSE(res, "token", { text: result.value });
      result = await stream.next();
    }

    if (!result.done) {
      await stream.return();
    }
  } catch (error) {
    streamError = error;
  }

  // 5. Save whatever the user actually received, then close the stream.
  const savedMessage = await saveAssistantMessage(conversation._id, fullText);

  if (!clientDisconnected) {
    if (streamError) {
      const errorMessage =
        streamError instanceof AppError
          ? streamError.message
          : "Something went wrong while generating the response.";
      sendSSE(res, "error", { message: errorMessage });
    } else {
      sendSSE(res, "done", { messageId: savedMessage ? savedMessage.id : null });
    }
  }

  res.end();
}