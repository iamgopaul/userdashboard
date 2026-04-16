import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { hashPassword, verifyPassword, signToken } from "../auth.js";
import type { PublicUser } from "../types.js";

export const authRouter = Router();

function toPublicUser(row: typeof users.$inferSelect): PublicUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    websiteUrl: row.website_url,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at.toISOString(),
  };
}

authRouter.post("/register", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const { username, email, password, displayName } = body;

  if (
    typeof username !== "string" || !username.trim() ||
    typeof email !== "string" || !email.trim() ||
    typeof password !== "string" || password.length < 8 ||
    typeof displayName !== "string" || !displayName.trim()
  ) {
    res.status(400).json({ error: "username, email, displayName are required; password must be at least 8 characters" });
    return;
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username.trim()))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const emailExists = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);

  if (emailExists.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const password_hash = await hashPassword(password);
  const [row] = await db
    .insert(users)
    .values({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      display_name: displayName.trim(),
    })
    .returning();

  const token = signToken({ sub: row.id, username: row.username });
  res.status(201).json({ token, user: toPublicUser(row) });
});

authRouter.post("/login", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const { username, password } = body;

  if (typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "username and password are required" });
    return;
  }

  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.username, username.trim()))
    .limit(1);

  if (!row) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({ sub: row.id, username: row.username });
  res.json({ token, user: toPublicUser(row) });
});
