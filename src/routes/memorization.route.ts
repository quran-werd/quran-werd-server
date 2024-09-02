import express from "express";
import { addMemorization, getMemorizationByChapterNumber } from "../controllers";
import { jwtAuth } from "../middlewares/auth.middleware";

var memorizationRouter = express.Router();

memorizationRouter.post("/add", jwtAuth, addMemorization);
memorizationRouter.get("/:chapter_number", jwtAuth, getMemorizationByChapterNumber);

export default memorizationRouter;
