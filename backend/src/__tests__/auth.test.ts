import { mock, describe, test, expect, beforeEach } from "bun:test";
import jwt from "jsonwebtoken";
import { createDbMock, makeUserRow, TEST_JWT_SECRET } from "./helpers.js";

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

beforeEach(() => setResults());

describe("POST /api/register", () => {
  const validBody = {
    username: "newuser",
    email: "new@example.com",
    password: "password123",
    displayName: "New User",
  };

  test("returns 400 when required fields are missing", async () => {
    const res = await request(app).post("/api/register").send({ username: "x" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  test("returns 400 when password is too short", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ ...validBody, password: "short" });
    expect(res.status).toBe(400);
  });

  test("returns 409 when username is already taken", async () => {
    setResults([{ id: "existing-id" }]); // username check returns a row
    const res = await request(app).post("/api/register").send(validBody);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/username/i);
  });

  test("returns 409 when email is already registered", async () => {
    setResults([], [{ id: "existing-id" }]); // username ok, email taken
    const res = await request(app).post("/api/register").send(validBody);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/email/i);
  });

  test("returns 201 with token and user on success", async () => {
    const row = makeUserRow({ username: "newuser", display_name: "New User" });
    setResults([], [], [row]); // username ok, email ok, insert result
    const res = await request(app).post("/api/register").send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.username).toBe("newuser");
    expect(res.body.user).not.toHaveProperty("password_hash");
  });
});

describe("POST /api/login", () => {
  test("returns 400 when fields are missing", async () => {
    const res = await request(app).post("/api/login").send({ username: "x" });
    expect(res.status).toBe(400);
  });

  test("returns 401 when user does not exist", async () => {
    setResults([]); // no user found
    const res = await request(app)
      .post("/api/login")
      .send({ username: "ghost", password: "password123" });
    expect(res.status).toBe(401);
  });

  test("returns 401 when password is wrong", async () => {
    const row = makeUserRow({ password_hash: "hashed:correctpassword" });
    setResults([row]);
    const res = await request(app)
      .post("/api/login")
      .send({ username: "testuser", password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  test("returns 200 with token and user on success", async () => {
    const row = makeUserRow({ password_hash: "hashed:password123" });
    setResults([row]);
    const res = await request(app)
      .post("/api/login")
      .send({ username: "testuser", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.username).toBe("testuser");
  });
});
