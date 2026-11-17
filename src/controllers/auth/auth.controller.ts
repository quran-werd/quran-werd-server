import { Request, Response } from "express";
import {
  authenticateWithGoogle,
  getUserById,
  MAX_NAME_LENGTH,
  updateUserName,
} from "../../services/auth.service";
import { sendError, sendSuccess } from "../../utils/apiResponse";

export const googleAuth = async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken || typeof idToken !== "string") {
    return sendError(res, "idToken is required", 400);
  }

  const result = await authenticateWithGoogle(idToken);
  if (!result) {
    return sendError(res, "Invalid Google token", 401);
  }

  return sendSuccess(res, {
    token: result.token,
    user: result.user,
  });
};

export const logout = async (_req: Request, res: Response) => {
  return sendSuccess(res, null);
};

export const getMe = async (req: Request, res: Response) => {
  const user = await getUserById(req.user_id!);
  if (!user) {
    return sendError(res, "User not found", 404);
  }

  return sendSuccess(res, user);
};

export const updateMe = async (req: Request, res: Response) => {
  const { name } = req.body ?? {};

  if (typeof name !== "string") {
    return sendError(res, "name is required", 400);
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return sendError(res, "name cannot be empty", 400);
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return sendError(res, `name must be at most ${MAX_NAME_LENGTH} characters`, 400);
  }

  const user = await updateUserName(req.user_id!, trimmed);
  if (!user) {
    return sendError(res, "User not found", 404);
  }

  return sendSuccess(res, user);
};
