import { Request, Response } from "express";
import * as RevisionPlanService from "../../services/revisionPlan.service";
import { sendError, sendSuccess } from "../../utils/apiResponse";

export const getRevisionPlan = async (req: Request, res: Response) => {
  const plan = await RevisionPlanService.getPlan(req.user_id!);
  if (!plan) {
    return sendError(res, "Plan not found", 404);
  }
  return sendSuccess(res, plan);
};

export const generateRevisionPlan = async (req: Request, res: Response) => {
  const { dailyCapacity } = req.body;
  if (typeof dailyCapacity !== "number") {
    return sendError(res, "dailyCapacity is required", 400);
  }

  try {
    const plan = await RevisionPlanService.generatePlan(
      req.user_id!,
      dailyCapacity
    );
    return sendSuccess(res, plan, "Plan generated successfully");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return sendError(res, message, message.includes("No memorized") ? 400 : 500);
  }
};

export const updateCapacity = async (req: Request, res: Response) => {
  const { dailyCapacity } = req.body;
  if (typeof dailyCapacity !== "number") {
    return sendError(res, "dailyCapacity is required", 400);
  }

  try {
    const plan = await RevisionPlanService.updateCapacity(
      req.user_id!,
      dailyCapacity
    );
    return sendSuccess(res, plan, "Capacity updated and plan regenerated");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message === "Plan not found" ? 404 : 500;
    return sendError(res, message, status);
  }
};
