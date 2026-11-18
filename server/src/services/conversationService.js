import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";

const DEFAULT_TITLE = "New chat";
const TITLE_PREVIEW_LENGTH = 40;

export function makeTitleFromMessage(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= TITLE_PREVIEW_LENGTH) return clean;
  return `${clean.slice(0, TITLE_PREVIEW_LENGTH).trimEnd()}...`;
}

export async function createConversation(userId, title = DEFAULT_TITLE) {
  return Conversation.create({ userId, title });
}

export async function listConversations(userId) {
  return Conversation.find({ userId }).sort({ updatedAt: -1 }).limit(100);
}

export async function getOwnedConversation(userId, conversationId) {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    userId,
  });
  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }
  return conversation;
}

export async function getConversationWithMessages(userId, conversationId) {
  const conversation = await getOwnedConversation(userId, conversationId);
  const messages = await Message.find({
    conversationId: conversation._id,
  }).sort({
    createdAt: 1,
    _id: 1,
  });
  return { conversation, messages };
}

export async function renameConversation(userId, conversationId, title) {
  const conversation = await Conversation.findOneAndUpdate(
    { _id: conversationId, userId },
    { title },
    { returnDocument: "after", runValidators: true },
  );
  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }
  return conversation;
}

export async function deleteConversation(userId, conversationId) {
  const conversation = await Conversation.findOneAndDelete({
    _id: conversationId,
    userId,
  });
  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }
  await Message.deleteMany({ conversationId: conversation._id });
}

export async function addMessage(conversationId, role, content) {
  const message = await Message.create({ conversationId, role, content });
  await Conversation.updateOne(
    { _id: conversationId },
    { $set: { updatedAt: new Date() } },
  );
  return message;
}

export async function getHistoryForModel(conversationId) {
  const recent = await Message.find({ conversationId })
    .sort({ createdAt: -1, _id: -1 })
    .limit(env.maxHistoryMessages)
    .select("role content -_id")
    .lean();

  return recent.reverse();
}
