import express from "express";
import {
  complete,
  getToday,
  skip,
} from "../controllers/revisionLog/revisionLog.controller";
import { jwtAuth } from "../middlewares/auth.middleware";

const revisionLogRouter = express.Router();

revisionLogRouter.get("/today", jwtAuth, getToday);
revisionLogRouter.post("/complete", jwtAuth, complete);
revisionLogRouter.post("/skip", jwtAuth, skip);

export default revisionLogRouter;
