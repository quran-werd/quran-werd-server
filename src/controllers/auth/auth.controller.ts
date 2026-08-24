import { Request, Response } from "express";
import { authenticateWithGoogle, getUserById } from "../../services/auth.service";
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
