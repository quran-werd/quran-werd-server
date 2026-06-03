import express from "express";
import {
  addRange,
  deleteRange,
  getMemorizations,
} from "../controllers/memorization/memorization.controller";
import { jwtAuth } from "../middlewares/auth.middleware";

const memorizationRouter = express.Router();

memorizationRouter.get("/", jwtAuth, getMemorizations);
memorizationRouter.post("/range", jwtAuth, addRange);
memorizationRouter.delete(
  "/range/:surah/:from/:to",
  jwtAuth,
  deleteRange
);

export default memorizationRouter;
