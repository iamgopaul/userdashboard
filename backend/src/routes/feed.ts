import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { posts, users } from "../db/schema.js";
import { requireAuth } from "../middleware.js";
import type { PublicPost } from "../types.js";

export const feedRouter = Router();

feedRouter.get("/posts", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;

  const rows = await db
    .select({
      id: posts.id,
      content: posts.content,
      created_at: posts.created_at,
      author_id: users.id,
      author_username: users.username,
      author_display_name: users.display_name,
      author_avatar_url: users.avatar_url,
    })
    .from(posts)
    .innerJoin(users, eq(posts.user_id, users.id))
    .orderBy(desc(posts.created_at))
    .limit(limit)
    .offset(offset);

  const result: PublicPost[] = rows.map((r) => ({
    id: r.id,
    content: r.content,
    createdAt: r.created_at.toISOString(),
    author: {
      id: r.author_id,
      username: r.author_username,
      displayName: r.author_display_name,
      avatarUrl: r.author_avatar_url,
    },
  }));

  res.json(result);
});

feedRouter.post("/posts", requireAuth, async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!content) {
    res.status(400).json({ error: "Post content cannot be empty" });
    return;
  }
  if (content.length > 500) {
    res.status(400).json({ error: "Post content must be 500 characters or less" });
    return;
  }

  const [post] = await db
    .insert(posts)
    .values({ user_id: req.auth!.sub, content })
    .returning();

  const [author] = await db
    .select({
      id: users.id,
      username: users.username,
      display_name: users.display_name,
      avatar_url: users.avatar_url,
    })
    .from(users)
    .where(eq(users.id, req.auth!.sub))
    .limit(1);

  const result: PublicPost = {
    id: post.id,
    content: post.content,
    createdAt: post.created_at.toISOString(),
    author: {
      id: author.id,
      username: author.username,
      displayName: author.display_name,
      avatarUrl: author.avatar_url,
    },
  };

  res.status(201).json(result);
});
