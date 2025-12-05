import { NextFunction, Request, Response } from "express";
import { verifyAccessToken, JWTPayload } from "../services/jwt.service";

export const jwtAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.sendStatus(401); // Unauthorized
  }

  // Verify access token (automatically checks expiration)
  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.sendStatus(403); // Forbidden - invalid or expired token
  }

  req.user_id = payload.user_id;
  next();
};
