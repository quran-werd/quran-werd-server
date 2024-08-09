import express from "express";
import { addMemorization, getMemorizationByChapterNumber } from "../controllers";

var memorizationRouter = express.Router();

memorizationRouter.post("/add", addMemorization);
memorizationRouter.get("/:chapter_number", getMemorizationByChapterNumber);

export default memorizationRouter;
