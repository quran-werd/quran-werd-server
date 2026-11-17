import { Request, Response } from "express";
import * as MemorizationService from "../../services/memorization.service";
import {
  resyncIncompleteAfterMemorizationAdd,
  resyncIncompleteAfterMemorizationDelete,
} from "../../services/revisionPlan.service";
import { sendError, sendSuccess } from "../../utils/apiResponse";

export const getMemorizations = async (req: Request, res: Response) => {
  try {
    const data = await MemorizationService.getMemorizations(req.user_id!);
    return sendSuccess(res, data);
  } catch {
    return sendError(res, "Internal server error", 500);
  }
};

export const addRanges = async (req: Request, res: Response) => {
  const { ranges } = req.body;

  if (!Array.isArray(ranges) || ranges.length === 0) {
    return sendError(res, "ranges must be a non-empty array", 400);
  }

  for (let index = 0; index < ranges.length; index++) {
    const { surah, from, to } = ranges[index];
    if (
      typeof surah !== "number" ||
      typeof from !== "number" ||
      typeof to !== "number"
    ) {
      return sendError(
        res,
        `ranges[${index}]: surah, from, and to must be numbers`,
        400
      );
    }
  }

  try {
    const {
      ranges: updatedRanges,
      results,
      changed,
    } = await MemorizationService.addRanges(req.user_id!, ranges);

    const planRegenerated = changed
      ? await resyncIncompleteAfterMemorizationAdd(req.user_id!)
      : false;

    return sendSuccess(
      res,
      { ranges: updatedRanges, results, changed, planRegenerated },
      "Ranges added successfully"
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message === "Internal server error" ? 500 : 400;
    return sendError(res, message, status);
  }
};

export const deleteRange = async (req: Request, res: Response) => {
  const surah = Number(req.params.surah);
  const from = Number(req.params.from);
  const to = Number(req.params.to);

  if (Number.isNaN(surah) || Number.isNaN(from) || Number.isNaN(to)) {
    return sendError(res, "Invalid range parameters", 400);
  }

  try {
    const {
      ranges: updatedRanges,
      results,
      changed,
    } = await MemorizationService.deleteRange(req.user_id!, surah, from, to);

    const planRegenerated = changed
      ? await resyncIncompleteAfterMemorizationDelete(
          req.user_id!,
          surah,
          from,
          to
        )
      : false;

    return sendSuccess(
      res,
      { ranges: updatedRanges, results, changed, planRegenerated },
      "Range deleted successfully"
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message === "Internal server error" ? 500 : 400;
    return sendError(res, message, status);
  }
};
