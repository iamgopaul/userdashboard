import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import multer from "multer";

export const UPLOAD_PUBLIC_PREFIX = "/uploads";

const uploadDir = path.join(process.cwd(), "public", "uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const allowedMime = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const extForMime: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = extForMime[file.mimetype] ?? ".bin";
    cb(null, `${randomBytes(16).toString("hex")}${ext}`);
  },
});

export const avatarUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedMime.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP, or GIF images are allowed"));
    }
  },
});

export function removeStoredAvatar(url: string | null | undefined): void {
  if (!url || !url.startsWith(`${UPLOAD_PUBLIC_PREFIX}/`)) return;
  const relative = url.slice(UPLOAD_PUBLIC_PREFIX.length + 1);
  if (!relative || relative.includes("/") || relative.includes("\\")) return;
  const resolvedDir = path.resolve(uploadDir);
  const full = path.resolve(uploadDir, relative);
  if (!full.startsWith(resolvedDir + path.sep) && full !== resolvedDir) return;
  fs.unlink(full, () => {});
}
