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

/**
 * Shared streaming logic.
 *  - modelMessages: the messages to send to the AI
 *  - persist: async function called ONLY after the AI has produced its first chunk.
 *             It does the database writes that must happen before streaming
 *             and returns the conversation document.
 */
async function runStream(res, { modelMessages, persist }) {
  let clientDisconnected = res.destroyed;
  res.on("close", () => {
    clientDisconnected = true;
  });

  const stream = streamChatCompletion(modelMessages);
  const first = await stream.next();

  if (first.done) {
    throw new AppError("The AI returned an empty response. Try rephrasing your message.", 502);
  }

  // The user pressed Stop before anything arrived: leave no trace in the database.
  if (clientDisconnected) {
    await stream.return();
    return;
  }

  const conversation = await persist();

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

export async function streamChat(req, res) {
  const userId = req.user._id;
  const { message, conversationId } = req.body;

  let existing = null;
  let history = [];

  if (conversationId) {
    existing = await conversationService.getOwnedConversation(userId, conversationId);
    history = await conversationService.getHistoryForModel(existing._id);
  }

  await runStream(res, {
    modelMessages: [...history, { role: "user", content: message }],
    persist: async () => {
      const conversation =
        existing ??
        (await conversationService.createConversation(
          userId,
          conversationService.makeTitleFromMessage(message),
        ));
      await conversationService.addMessage(conversation._id, "user", message);
      return conversation;
    },
  });
}

export async function regenerateChat(req, res) {
  const userId = req.user._id;
  const conversation = await conversationService.getOwnedConversation(
    userId,
    req.body.conversationId,
  );

  const lastMessage = await conversationService.getLastMessage(conversation._id);
  if (!lastMessage) {
    throw new AppError("This conversation has no messages yet.", 400);
  }

  const history = await conversationService.getHistoryForModel(conversation._id);
  const modelMessages = lastMessage.role === "assistant" ? history.slice(0, -1) : history;

  if (modelMessages.length === 0 || modelMessages[modelMessages.length - 1].role !== "user") {
    throw new AppError("There is no user message to answer.", 400);
  }

  await runStream(res, {
    modelMessages,
    persist: async () => {
      if (lastMessage.role === "assistant") {
        await conversationService.deleteMessage(lastMessage._id);
      }
      return conversation;
    },
  });
}