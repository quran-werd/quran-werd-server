import express from "express";
import {
  addRanges,
  deleteRange,
  getMemorizations,
} from "../controllers/memorization/memorization.controller";
import { jwtAuth } from "../middlewares/auth.middleware";

const memorizationRouter = express.Router();

memorizationRouter.get("/", jwtAuth, getMemorizations);
memorizationRouter.post("/ranges", jwtAuth, addRanges);
memorizationRouter.delete(
  "/range/:surah/:from/:to",
  jwtAuth,
  deleteRange
);

export default memorizationRouter;
