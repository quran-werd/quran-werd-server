import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const jwtSecretKey = process.env.JWT_SECRET_KEY || "";
const jwtRefreshSecretKey =
  process.env.JWT_REFRESH_SECRET_KEY || jwtSecretKey + "_refresh";

export type JWTPayload = {
  user_id: string;
  iat?: number; // Issued at timestamp (automatically added by JWT)
};

// Generate short-lived access token (15 minutes)
export const generateAccessToken = (user_id: string): string => {
  const payload: Omit<JWTPayload, "iat"> = { user_id };
  return jwt.sign(payload, jwtSecretKey, { expiresIn: "15m" });
};

// Generate long-lived refresh token (30 days)
export const generateRefreshToken = (user_id: string): string => {
  const payload: Omit<JWTPayload, "iat"> = { user_id };
  return jwt.sign(payload, jwtRefreshSecretKey, { expiresIn: "30d" });
};

// Verify access token
export const verifyAccessToken = (token: string): JWTPayload | null => {
  try {
    const payload = jwt.verify(token, jwtSecretKey) as JWTPayload;
    return payload;
  } catch (error) {
    return null;
  }
};

// Verify refresh token
export const verifyRefreshToken = (token: string): JWTPayload | null => {
  try {
    const payload = jwt.verify(token, jwtRefreshSecretKey) as JWTPayload;
    return payload;
  } catch (error) {
    return null;
  }
};

// Legacy function for backward compatibility (generates access token)
export const generateToken = generateAccessToken;
