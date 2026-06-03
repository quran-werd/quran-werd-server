import { Request, Response } from "express";
import * as RevisionLogService from "../../services/revisionLog.service";
import { sendError, sendSuccess } from "../../utils/apiResponse";

export const getToday = async (req: Request, res: Response) => {
  try {
    const data = await RevisionLogService.getTodayWerd(req.user_id!);
    return sendSuccess(res, data);
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
    const log = await RevisionLogService.logComplete(req.user_id!, werdId);
    return sendSuccess(
      res,
      {
        _id: log.id,
        werdId: log.werdId.toString(),
        status: log.status,
        date: log.date.toISOString(),
      },
      "Werd marked as completed"
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return sendError(res, message, message === "Werd not found" ? 404 : 500);
  }
};

export const skip = async (req: Request, res: Response) => {
  const { werdId } = req.body;
  if (!werdId || typeof werdId !== "string") {
    return sendError(res, "werdId is required", 400);
  }

  try {
    const log = await RevisionLogService.logSkip(req.user_id!, werdId);
    return sendSuccess(
      res,
      {
        _id: log.id,
        werdId: log.werdId.toString(),
        status: log.status,
        date: log.date.toISOString(),
      },
      "Werd marked as skipped"
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return sendError(res, message, message === "Werd not found" ? 404 : 500);
  }
};
