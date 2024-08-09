import { Request, Response } from "express";
import { addMemorizedRange } from "../../services";
export const addMemorization = async (req: Request, res: Response) => {
  const { userId, chapter_number, from, to } = req.body;

  const user = await addMemorizedRange(userId, chapter_number, from, to);

  if (!user) {
    res.sendStatus(400);
  }

  res.status(200).send(user);
};

export const getMemorizationByChapterNumber = async (req: Request, res: Response) => {
  const { chapter_number } = req.body;

  // const isAdded = await addMemorizedRange(userId, chapter_number, from, to);

  // if (!isAdded) {
  //   res.sendStatus(400);
  // }

  res.sendStatus(200);
};
