import { mock, describe, test, expect, beforeEach } from "bun:test";
import jwt from "jsonwebtoken";
import { createDbMock, makeToken, makeUserRow, TEST_JWT_SECRET } from "./helpers.js";

const { db, setResults } = createDbMock();

mock.module("../db/index.js", () => ({ db }));
mock.module("../auth.js", () => ({
  hashPassword: async (p: string) => `hashed:${p}`,
  verifyPassword: async (p: string, h: string) => h === `hashed:${p}`,
  signToken: (payload: { sub: string; username: string }) =>
    jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: "7d" }),
  verifyToken: (token: string) => {
    try {
      const decoded = jwt.verify(token, TEST_JWT_SECRET);
      if (typeof decoded !== "object" || decoded === null) return null;
      const o = decoded as Record<string, unknown>;
      if (typeof o.sub !== "string" || typeof o.username !== "string") return null;
      return { sub: o.sub, username: o.username };
    } catch {
      return null;
    }
  },
}));

const request = (await import("supertest")).default;
const app = (await import("../app.js")).default;

const TOKEN = makeToken("user-1", "testuser");
const AUTH = { Authorization: `Bearer ${TOKEN}` };

beforeEach(() => setResults());

describe("GET /api/me", () => {
  test("returns 401 without auth header", async () => {
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(401);
  });

  test("returns 404 when user no longer exists in db", async () => {
    setResults([]); // no row found
    const res = await request(app).get("/api/me").set(AUTH);
    expect(res.status).toBe(404);
  });

  test("returns user profile on success", async () => {
    const row = makeUserRow();
    setResults([row]);
    const res = await request(app).get("/api/me").set(AUTH);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe("testuser");
    expect(res.body).not.toHaveProperty("password_hash");
    expect(res.body).not.toHaveProperty("email");
  });
});

describe("PATCH /api/me", () => {
  test("returns 401 without auth", async () => {
    const res = await request(app).patch("/api/me").send({ displayName: "New" });
    expect(res.status).toBe(401);
  });

  test("returns 400 when no valid fields are provided", async () => {
    const res = await request(app).patch("/api/me").set(AUTH).send({ unknown: "field" });
    expect(res.status).toBe(400);
  });

  test("updates displayName and returns updated user", async () => {
    const updated = makeUserRow({ display_name: "Updated Name" });
    setResults([updated]);
    const res = await request(app)
      .patch("/api/me")
      .set(AUTH)
      .send({ displayName: "Updated Name" });
    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe("Updated Name");
  });

  test("clears bio when empty string is sent", async () => {
    const updated = makeUserRow({ bio: null });
    setResults([updated]);
    const res = await request(app).patch("/api/me").set(AUTH).send({ bio: "" });
    expect(res.status).toBe(200);
    expect(res.body.bio).toBeNull();
  });
});
