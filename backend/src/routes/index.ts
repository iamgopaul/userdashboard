import { Router } from "express";
import { authRouter } from "./auth.js";
import { profileRouter } from "./profile.js";
import { feedRouter } from "./feed.js";

const router = Router();

router.use("/", authRouter);
router.use("/", profileRouter);
router.use("/", feedRouter);

export { router as apiRouter };
