import { Request, Response } from "express";
import { sendOtp, verifyOtp } from "./twilio.service";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "./jwt.service";
import User from "../models/User";

export const login = async (req: Request, res: Response) => {
  const { phone } = req.body;

  try {
    const verification = await sendOtp(phone);

    if (!verification) {
      return res.status(500).json({ error: "Failed to send OTP" });
    }

    res.status(200).json({ message: "OTP sent successfully", verification });
  } catch (error) {
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

export const verifyLogin = async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  try {
    // Verify OTP with Twilio
    const verificationCheck = await verifyOtp(phone, otp);

    // Check if OTP verification was successful
    if (!verificationCheck || verificationCheck.status !== "approved") {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Get or create user
    let user = await getUserByPhone(phone);

    if (!user) {
      // Auto-create user if doesn't exist
      user = await User.create({
        phone: String(phone),
      });
    }

    // Generate both access and refresh tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in user model
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    // Handle Twilio errors (invalid OTP, expired, etc.)
    const errorMessage = error.message || "Verification failed";
    res.status(400).json({
      error:
        errorMessage.includes("Invalid") || errorMessage.includes("expired")
          ? "Invalid or expired OTP"
          : errorMessage,
    });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      return res
        .status(403)
        .json({ error: "Invalid or expired refresh token" });
    }

    // Get user and verify refresh token matches stored token
    const user = await User.findById(payload.user_id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user.id);

    res.status(200).json({
      accessToken,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to refresh token" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user_id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Clear refresh token to invalidate session
    user.refreshToken = undefined;
    await user.save();

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to logout" });
  }
};

export const getUserByPhone = async (phone: string | number) => {
  const user = await User.findOne({ phone: String(phone) });
  return user;
};
