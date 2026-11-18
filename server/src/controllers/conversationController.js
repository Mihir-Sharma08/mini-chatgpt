import * as conversationService from "../services/conversationService.js";

export async function getConversations(req, res) {
  const conversations = await conversationService.listConversations(req.user._id);
  res.json({ success: true, data: conversations });
}

export async function createConversation(req, res) {
  const title = req.body?.title || undefined;
  const conversation = await conversationService.createConversation(req.user._id, title);
  res.status(201).json({ success: true, data: conversation });
}

export async function getConversation(req, res) {
  const data = await conversationService.getConversationWithMessages(req.user._id, req.params.id);
  res.json({ success: true, data });
}

export async function renameConversation(req, res) {
  const conversation = await conversationService.renameConversation(
    req.user._id,
    req.params.id,
    req.body.title,
  );
  res.json({ success: true, data: conversation });
}

export async function deleteConversation(req, res) {
  await conversationService.deleteConversation(req.user._id, req.params.id);
  res.status(204).end();
}