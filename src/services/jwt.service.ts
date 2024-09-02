import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const jwtSecretKey = process.env.JWT_SECRET_KEY || "";

export type JWTPayload = { user_id: string };

export const generateToken = (user_id: string) => {
  const payload: JWTPayload = { user_id };
  return jwt.sign(payload, jwtSecretKey, {});
};
