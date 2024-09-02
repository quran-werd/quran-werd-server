import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const jwtSecretKey = process.env.JWT_SECRET_KEY || "";

export type JWTPayload = { userId: string };

export const generateToken = (userId: string) => {
  const payload: JWTPayload = { userId };
  return jwt.sign(payload, jwtSecretKey, {});
};
