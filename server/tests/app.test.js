import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { connectTestDb, disconnectTestDb } from "./helpers.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);

describe("health and security headers", () => {
  it("reports healthy when the database is connected", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, status: "ok", database: "connected" });
  });

  it("sets protective headers and hides the framework", async () => {
    const res = await request(app).get("/api/health");

    expect(res.headers["x-powered-by"]).toBeUndefined();
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});

describe("error handling", () => {
  it("returns a JSON 404 for unknown routes", async () => {
    const res = await request(app).get("/api/does-not-exist");

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false });
    expect(res.body.message).toContain("Route not found");
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email":');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid JSON in request body");
  });

  it("returns 413 for oversized bodies", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@b.com", password: "x".repeat(200_000) });

    expect(res.status).toBe(413);
  });
});

describe("CORS", () => {
  it("allows the configured frontend origin", async () => {
    const res = await request(app).get("/api/health").set("Origin", "http://localhost:5173");

    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });

  it("does not grant access to other origins", async () => {
    const res = await request(app).get("/api/health").set("Origin", "https://evil.example");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});