import { Request, Response } from "express";
import { MemorizationService } from "../../services";

export const addMemorization = async (req: Request, res: Response) => {
  const { body, user_id } = req;
  const { chapter_number, from, to } = body;

  const user = await MemorizationService.addMemorizedRange(user_id!, chapter_number, from, to);

  if (!user) {
    res.sendStatus(400);
  }

  res.status(200).send(user);
};

export const getMemorizationByChapterNumber = async (req: Request, res: Response) => {
  const {
    user_id,
    params: { chapter_number },
  } = req;

  const chapterMemorization = await MemorizationService.getMemorizationByChapterNumber(user_id!, +chapter_number);

  res.status(200).send(chapterMemorization);
};

export const getMemorizations = async (req: Request, res: Response) => {
  const { user_id } = req;

  const memorizations = await MemorizationService.getMemorizations(user_id!);

  res.status(200).send(memorizations);
};
