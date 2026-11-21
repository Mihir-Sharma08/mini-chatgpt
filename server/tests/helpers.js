import mongoose from "mongoose";
import request from "supertest";
import app from "../src/app.js";

let userCounter = 0;

export async function connectTestDb() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  // Make sure unique indexes exist before any test relies on them.
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
}

export async function clearDatabase() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function disconnectTestDb() {
  await mongoose.disconnect();
}

export async function createUser(overrides = {}) {
  userCounter += 1;

  const credentials = {
    username: `tester_${userCounter}`,
    email: `tester${userCounter}@example.com`,
    password: "correct-horse-9",
    ...overrides,
  };

  const response = await request(app).post("/api/auth/register").send(credentials);

  return { credentials, token: response.body.data.token, user: response.body.data.user };
}

export const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// Turns the raw SSE text into [{ event, data }, ...] so tests can assert on it.
export function parseSSE(text) {
  return text
    .split("\n\n")
    .filter(Boolean)
    .map((frame) => {
      const event = /^event: (.*)$/m.exec(frame)?.[1];
      const data = JSON.parse(/^data: (.*)$/m.exec(frame)?.[1] ?? "{}");
      return { event, data };
    });
}