import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const jwtSecretKey = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "";

export type JWTPayload = {
  user_id: string;
  iat?: number;
};

export const generateToken = (user_id: string): string => {
  const payload: Omit<JWTPayload, "iat"> = { user_id };
  return jwt.sign(payload, jwtSecretKey, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, jwtSecretKey) as JWTPayload;
  } catch {
    return null;
  }
};
