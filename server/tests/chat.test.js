import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/services/aiService.js", () => ({ streamChatCompletion: vi.fn() }));

import { streamChatCompletion } from "../src/services/aiService.js";
import app from "../src/app.js";
import Conversation from "../src/models/Conversation.js";
import Message from "../src/models/Message.js";
import { AppError } from "../src/utils/AppError.js";
import {
  connectTestDb,
  clearDatabase,
  disconnectTestDb,
  createUser,
  authHeader,
  parseSSE,
} from "./helpers.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(async () => {
  await clearDatabase();
  vi.clearAllMocks();
});

// A fake AI: yields the given chunks, then optionally fails.
function fakeStream(chunks, { failWith } = {}) {
  return (async function* () {
    for (const chunk of chunks) yield chunk;
    if (failWith) throw failWith;
  })();
}

async function sendChat(token, body) {
  return request(app).post("/api/chat/stream").set(authHeader(token)).send(body);
}

async function storedMessages(conversationId) {
  const messages = await Message.find({ conversationId }).sort({ createdAt: 1, _id: 1 });
  return messages.map((m) => [m.role, m.content]);
}

describe("POST /api/chat/stream", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/chat/stream").send({ message: "hi" });
    expect(res.status).toBe(401);
  });

  it("streams meta, tokens and done, and saves both messages", async () => {
    const { token } = await createUser();
    streamChatCompletion.mockImplementation(() => fakeStream(["Hello", " world"]));

    const res = await sendChat(token, { message: "Hi there" });
    const events = parseSSE(res.text);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/event-stream/);
    expect(events.map((e) => e.event)).toEqual(["meta", "token", "token", "done"]);
    expect(events[1].data.text).toBe("Hello");

    const conversationId = events[0].data.conversationId;
    expect(await storedMessages(conversationId)).toEqual([
      ["user", "Hi there"],
      ["assistant", "Hello world"],
    ]);
  });

  it("sends the saved history to the model on a follow-up message", async () => {
    const { token } = await createUser();
    streamChatCompletion.mockImplementation(() => fakeStream(["Hello", " world"]));

    const first = await sendChat(token, { message: "Hi there" });
    const conversationId = parseSSE(first.text)[0].data.conversationId;

    await sendChat(token, { message: "And now?", conversationId });

    expect(streamChatCompletion).toHaveBeenLastCalledWith([
      { role: "user", content: "Hi there" },
      { role: "assistant", content: "Hello world" },
      { role: "user", content: "And now?" },
    ]);
  });

  it("refuses to continue another user's conversation and never calls the AI", async () => {
    const alice = await createUser();
    const bob = await createUser();
    streamChatCompletion.mockImplementation(() => fakeStream(["Hi"]));

    const aliceChat = await sendChat(alice.token, { message: "secret" });
    const conversationId = parseSSE(aliceChat.text)[0].data.conversationId;
    vi.clearAllMocks();

    const res = await sendChat(bob.token, { message: "let me in", conversationId });

    expect(res.status).toBe(404);
    expect(streamChatCompletion).not.toHaveBeenCalled();
  });

  it("validates the request body", async () => {
    const { token } = await createUser();

    const empty = await sendChat(token, { message: "   " });
    const badId = await sendChat(token, { message: "hi", conversationId: "not-an-id" });

    expect(empty.status).toBe(400);
    expect(badId.status).toBe(400);
  });

  it("returns a proper status and saves nothing when the AI fails immediately", async () => {
    const { token } = await createUser();
    streamChatCompletion.mockImplementation(() =>
      fakeStream([], { failWith: new AppError("AI is busy", 429) }),
    );

    const res = await sendChat(token, { message: "Hello?" });

    expect(res.status).toBe(429);
    expect(await Conversation.countDocuments()).toBe(0);
    expect(await Message.countDocuments()).toBe(0);
  });

  it("sends an error event and keeps the partial answer when the AI fails mid-stream", async () => {
    const { token } = await createUser();
    streamChatCompletion.mockImplementation(() =>
      fakeStream(["Partial"], { failWith: new AppError("Gemini died", 502) }),
    );

    const res = await sendChat(token, { message: "Tell me a story" });
    const events = parseSSE(res.text);

    expect(res.status).toBe(200);
    expect(events.map((e) => e.event)).toEqual(["meta", "token", "error"]);
    expect(events[2].data.message).toBe("Gemini died");

    const conversationId = events[0].data.conversationId;
    expect(await storedMessages(conversationId)).toEqual([
      ["user", "Tell me a story"],
      ["assistant", "Partial"],
    ]);
  });
});

describe("POST /api/chat/regenerate", () => {
  async function startConversation(token) {
    streamChatCompletion.mockImplementation(() => fakeStream(["Old answer"]));
    const res = await sendChat(token, { message: "Question" });
    return parseSSE(res.text)[0].data.conversationId;
  }

  it("replaces the last answer instead of adding a new one", async () => {
    const { token } = await createUser();
    const conversationId = await startConversation(token);
    streamChatCompletion.mockImplementation(() => fakeStream(["New answer"]));

    const res = await request(app)
      .post("/api/chat/regenerate")
      .set(authHeader(token))
      .send({ conversationId });

    expect(res.status).toBe(200);
    expect(await storedMessages(conversationId)).toEqual([
      ["user", "Question"],
      ["assistant", "New answer"],
    ]);
  });

  it("keeps the old answer when regeneration fails before producing text", async () => {
    const { token } = await createUser();
    const conversationId = await startConversation(token);
    streamChatCompletion.mockImplementation(() =>
      fakeStream([], { failWith: new AppError("AI unavailable", 503) }),
    );

    const res = await request(app)
      .post("/api/chat/regenerate")
      .set(authHeader(token))
      .send({ conversationId });

    expect(res.status).toBe(503);
    expect(await storedMessages(conversationId)).toEqual([
      ["user", "Question"],
      ["assistant", "Old answer"],
    ]);
  });

  it("returns 404 for another user's conversation", async () => {
    const alice = await createUser();
    const bob = await createUser();
    const conversationId = await startConversation(alice.token);

    const res = await request(app)
      .post("/api/chat/regenerate")
      .set(authHeader(bob.token))
      .send({ conversationId });

    expect(res.status).toBe(404);
  });
});