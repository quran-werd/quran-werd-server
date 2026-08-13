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

export const getToday = async (req: Request, res: Response) => {
  try {
    const data = await RevisionPlanService.getTodayWerd(req.user_id!);
    return sendSuccess(res, data);
  } catch {
    return sendError(res, "Internal server error", 500);
  }
};

export const getNext = async (req: Request, res: Response) => {
  try {
    const werd = await RevisionPlanService.getNextWerd(req.user_id!);
    return sendSuccess(res, { werd });
  } catch {
    return sendError(res, "Internal server error", 500);
  }
};

export const complete = async (req: Request, res: Response) => {
  const { werdId } = req.body;
  if (!werdId || typeof werdId !== "string") {
    return sendError(res, "werdId is required", 400);
  }

  try {
    const { werd, alreadyCompleted } = await RevisionPlanService.completeWerd(
      req.user_id!,
      werdId
    );
    return sendSuccess(
      res,
      { werd, status: "completed", alreadyCompleted },
      alreadyCompleted ? "Werd already completed" : "Werd marked as completed"
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "Plan not found" || message === "Werd not found" ? 404 : 500;
    return sendError(res, message, status);
  }
};
