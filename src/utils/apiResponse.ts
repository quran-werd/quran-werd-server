import { Response } from "express";

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  status = 200
) => {
  return res.status(status).json({
    success: true,
    data,
    ...(message ? { message } : {}),
  });
};

export const sendError = (
  res: Response,
  error: string,
  status = 400
) => {
  return res.status(status).json({
    success: false,
    error,
  });
};
