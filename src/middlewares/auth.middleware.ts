import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../services/jwt.service";
import { sendError } from "../utils/apiResponse";

export const jwtAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return sendError(res, "Unauthorized", 401);
  }

  const payload = verifyAccessToken(token);

  if (!payload) {
    return sendError(res, "Unauthorized", 401);
  }

  req.user_id = payload.user_id;
  next();
};
