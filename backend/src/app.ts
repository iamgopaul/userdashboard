import path from "node:path";
import cors from "cors";
import express from "express";
import multer from "multer";
import { config } from "dotenv";
import { apiRouter } from "./routes/index.js";

config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));
app.use("/api", apiRouter);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "Image too large (max 2 MB)" });
        return;
      }
      res.status(400).json({ error: err.message });
      return;
    }
    if (err instanceof Error && err.message.includes("Only JPEG")) {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
);

export default app;
