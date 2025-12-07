import { Request, Response } from "express";
import { MemorizationService } from "../../services";

export const addMemorization = async (req: Request, res: Response) => {
  const { body, user_id } = req;
  const { ranges } = body;

  // Validate request body
  if (!ranges || !Array.isArray(ranges) || ranges.length === 0) {
    return res
      .status(400)
      .json({ error: "ranges array is required and must not be empty" });
  }

  // Validate each range
  for (const range of ranges) {
    if (
      typeof range.chapterId !== "number" ||
      typeof range.startVerse !== "number" ||
      typeof range.endVerse !== "number" ||
      typeof range.wordsCount !== "number"
    ) {
      return res.status(400).json({
        error:
          "Each range must have chapterId, startVerse, endVerse, and wordsCount as numbers",
      });
    }
  }

  const savedMemorizations = await MemorizationService.addMemorizedRanges(
    user_id!,
    ranges
  );

  if (!savedMemorizations || savedMemorizations.length === 0) {
    return res.status(400).json({ error: "Failed to save memorizations" });
  }

  // Get the updated memorizations grouped by chapter
  const memorizations = await MemorizationService.getMemorizations(user_id!);

  res.status(200).json({
    message: "Memorizations saved successfully",
    memorizations: memorizations || {},
  });
};

export const getMemorizations = async (req: Request, res: Response) => {
  const { user_id } = req;

  const memorizations = await MemorizationService.getMemorizations(user_id!);

  res.status(200).json(memorizations || {});
};

// Get memorizations for a specific chapter
export const getMemorizationByChapterNumber = async (
  req: Request,
  res: Response
) => {
  const {
    user_id,
    params: { chapter_number },
  } = req;

  const chapterMemorization =
    await MemorizationService.getMemorizationByChapterNumber(
      user_id!,
      +chapter_number
    );

  res.status(200).json({
    [chapter_number]: chapterMemorization || [],
  });
};
