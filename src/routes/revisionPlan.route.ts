import express from "express";
import {
  generateRevisionPlan,
  getRevisionPlan,
  updateCapacity,
} from "../controllers/revisionPlan/revisionPlan.controller";
import { jwtAuth } from "../middlewares/auth.middleware";

const revisionPlanRouter = express.Router();

revisionPlanRouter.get("/", jwtAuth, getRevisionPlan);
revisionPlanRouter.post("/generate", jwtAuth, generateRevisionPlan);
revisionPlanRouter.put("/capacity", jwtAuth, updateCapacity);

export default revisionPlanRouter;
