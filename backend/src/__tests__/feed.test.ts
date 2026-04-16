import { mock, describe, test, expect, beforeEach } from "bun:test";
import jwt from "jsonwebtoken";
import { createDbMock, makeToken, TEST_JWT_SECRET } from "./helpers.js";

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

const mockPostRow = {
  id: "post-1",
  content: "Hello world",
  created_at: new Date("2024-01-01T00:00:00Z"),
  author_id: "user-1",
  author_username: "testuser",
  author_display_name: "Test User",
  author_avatar_url: null,
};

beforeEach(() => setResults());

describe("GET /api/posts", () => {
  test("returns empty array when no posts exist", async () => {
    setResults([]);
    const res = await request(app).get("/api/posts");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("returns posts with author info", async () => {
    setResults([mockPostRow]);
    const res = await request(app).get("/api/posts");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].content).toBe("Hello world");
    expect(res.body[0].author.username).toBe("testuser");
    expect(res.body[0].createdAt).toBeTruthy();
  });

  test("does not require authentication", async () => {
    setResults([]);
    const res = await request(app).get("/api/posts");
    expect(res.status).toBe(200);
  });
});

describe("POST /api/posts", () => {
  test("returns 401 without auth", async () => {
    const res = await request(app).post("/api/posts").send({ content: "Hello" });
    expect(res.status).toBe(401);
  });

  test("returns 400 when content is empty", async () => {
    const res = await request(app).post("/api/posts").set(AUTH).send({ content: "  " });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/empty/i);
  });

  test("returns 400 when content exceeds 500 characters", async () => {
    const res = await request(app)
      .post("/api/posts")
      .set(AUTH)
      .send({ content: "x".repeat(501) });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/500/);
  });

  test("returns 201 with created post on success", async () => {
    const insertedPost = {
      id: "post-new",
      content: "Hello world",
      created_at: new Date("2024-01-01T00:00:00Z"),
      user_id: "user-1",
    };
    const author = {
      id: "user-1",
      username: "testuser",
      display_name: "Test User",
      avatar_url: null,
    };
    setResults([insertedPost], [author]); // insert result, then author lookup
    const res = await request(app)
      .post("/api/posts")
      .set(AUTH)
      .send({ content: "Hello world" });
    expect(res.status).toBe(201);
    expect(res.body.content).toBe("Hello world");
    expect(res.body.author.username).toBe("testuser");
    expect(res.body.id).toBe("post-new");
  });
});
