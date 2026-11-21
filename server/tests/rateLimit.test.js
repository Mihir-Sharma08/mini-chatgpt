import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { connectTestDb, clearDatabase, disconnectTestDb, createUser } from "./helpers.js";

beforeAll(async () => {
  process.env.SKIP_RATE_LIMITS = "false";
  await connectTestDb();
});

afterAll(async () => {
  process.env.SKIP_RATE_LIMITS = "true";
  await disconnectTestDb();
});

beforeEach(clearDatabase);

describe("login rate limiting", () => {
  it("counts only failed logins and blocks after 10 of them", async () => {
    const { credentials } = await createUser();
    const login = (password) =>
      request(app).post("/api/auth/login").send({ email: credentials.email, password });

    for (let i = 0; i < 12; i += 1) {
      const res = await login(credentials.password);
      expect(res.status).toBe(200);
    }

    for (let i = 0; i < 10; i += 1) {
      const res = await login("wrong-password-1");
      expect(res.status).toBe(401);
    }

    const blocked = await login("wrong-password-1");
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toContain("Too many login attempts");

    const blockedEvenWithCorrectPassword = await login(credentials.password);
    expect(blockedEvenWithCorrectPassword.status).toBe(429);
  });
});