import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import {
  connectTestDb,
  clearDatabase,
  disconnectTestDb,
  createUser,
  authHeader,
} from "./helpers.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(clearDatabase);

const validBody = { username: "aarav", email: "Aarav@Example.com", password: "correct-horse-9" };

describe("POST /api/auth/register", () => {
  it("creates an account, returns a token and never exposes the password hash", async () => {
    const res = await request(app).post("/api/auth/register").send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe("aarav@example.com");
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
  });

  it("stores a bcrypt hash and never the plaintext password", async () => {
    await request(app).post("/api/auth/register").send(validBody);

    const stored = await User.findOne({ email: "aarav@example.com" }).select("+passwordHash");

    expect(stored.passwordHash).not.toBe(validBody.password);
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$04\$/);
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send(validBody);
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validBody, username: "someone_else" });

    expect(res.status).toBe(409);
  });

  it("rejects invalid input with 400 and lists every problem", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "a!", email: "nope", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.details).toHaveLength(3);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials", async () => {
    const { credentials } = await createUser();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  it("gives the identical error for a wrong password and an unknown email", async () => {
    const { credentials } = await createUser();

    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "wrong-password-1" });
    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "ghost@example.com", password: "wrong-password-1" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it("blocks NoSQL injection attempts", async () => {
    await createUser();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: { $gt: "" }, password: "anything-1" });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  it("requires a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user for a valid token", async () => {
    const { token, user } = await createUser();
    const res = await request(app).get("/api/auth/me").set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(user.id);
  });

  it("rejects a tampered token", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .get("/api/auth/me")
      .set(authHeader(`${token.slice(0, -3)}abc`));

    expect(res.status).toBe(401);
  });

  it("rejects a valid token whose user was deleted", async () => {
    const { token, user } = await createUser();
    await User.deleteOne({ _id: user.id });

    const res = await request(app).get("/api/auth/me").set(authHeader(token));
    expect(res.status).toBe(401);
  });
});