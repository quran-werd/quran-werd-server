import express from "express";
import { addMemorization, getMemorizationByChapterNumber, getMemorizations } from "../controllers";
import { jwtAuth } from "../middlewares/auth.middleware";

var memorizationRouter = express.Router();

memorizationRouter.get("/", jwtAuth, getMemorizations);
memorizationRouter.get("/:chapter_number", jwtAuth, getMemorizationByChapterNumber);

// POST endpoint to save memorized ranges
memorizationRouter.post("/", jwtAuth, addMemorization);
// Legacy endpoint (kept for backward compatibility)
memorizationRouter.post("/add", jwtAuth, addMemorization);

export default memorizationRouter;
