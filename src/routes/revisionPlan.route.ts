import express from "express";
import {
  complete,
  generateRevisionPlan,
  getCurrent,
  getRevisionPlan,
  updateCapacity,
} from "../controllers/revisionPlan/revisionPlan.controller";
import { jwtAuth } from "../middlewares/auth.middleware";

const revisionPlanRouter = express.Router();

revisionPlanRouter.get("/", jwtAuth, getRevisionPlan);
revisionPlanRouter.post("/generate", jwtAuth, generateRevisionPlan);
revisionPlanRouter.put("/capacity", jwtAuth, updateCapacity);
revisionPlanRouter.get("/current", jwtAuth, getCurrent);
revisionPlanRouter.post("/complete", jwtAuth, complete);

export default revisionPlanRouter;
