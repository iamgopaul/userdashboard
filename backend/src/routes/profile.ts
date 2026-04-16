import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { requireAuth } from "../middleware.js";
import { avatarUpload, removeStoredAvatar, UPLOAD_PUBLIC_PREFIX } from "../upload.js";
import type { PublicUser } from "../types.js";

export const profileRouter = Router();

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

profileRouter.get("/me", requireAuth, async (req, res) => {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.id, req.auth!.sub))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(toPublicUser(row));
});

profileRouter.patch("/me", requireAuth, async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const patch: Partial<{ display_name: string; bio: string; website_url: string }> = {};

  if (typeof body.displayName === "string") patch.display_name = body.displayName.trim();
  if (typeof body.bio === "string") patch.bio = body.bio.trim() || null as unknown as string;
  if (typeof body.websiteUrl === "string") patch.website_url = body.websiteUrl.trim() || null as unknown as string;

  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const [row] = await db
    .update(users)
    .set({ ...patch, updated_at: new Date() })
    .where(eq(users.id, req.auth!.sub))
    .returning();

  res.json(toPublicUser(row));
});

profileRouter.post("/me/avatar", requireAuth, avatarUpload.single("avatar"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const [existing] = await db
    .select({ avatar_url: users.avatar_url })
    .from(users)
    .where(eq(users.id, req.auth!.sub))
    .limit(1);

  if (existing) removeStoredAvatar(existing.avatar_url);

  const avatar_url = `${UPLOAD_PUBLIC_PREFIX}/${req.file.filename}`;
  const [row] = await db
    .update(users)
    .set({ avatar_url, updated_at: new Date() })
    .where(eq(users.id, req.auth!.sub))
    .returning();

  res.json(toPublicUser(row));
});
