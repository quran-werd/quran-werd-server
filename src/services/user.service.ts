import { Request, Response } from "express";
import { sendOtp, verifyOtp } from "./twilio.service";
import { generateToken } from "./jwt.service";
import User from "../models/User";

export const login = async (req: Request, res: Response) => {
  const { phone } = req.body;

  const verification = await sendOtp(phone);

  if (!verification) {
    res.sendStatus(500);
  }

  res.status(200).send(verification);
};

export const verifyLogin = async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  try {
    await verifyOtp(phone, otp);

    const user = await getUserByPhone(phone);

    if (!user) {
      throw new Error("User not found");
    }

    const token = generateToken(user?.id);

    res.status(200).send(token);
  } catch (error) {
    res.status(400).send(error);
  }
};

export const getUserByPhone = async (phone: number) => {
  const user = await User.findOne({ phone });
  return user;
};
