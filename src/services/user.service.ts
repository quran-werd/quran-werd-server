import { Request, Response } from "express";
import { sendOtp, verifyOtp } from "./twilio.service";

export const login = async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;

  const verification = await sendOtp(phoneNumber);

  if (!verification) {
    res.sendStatus(500);
  }

  res.status(200).send(verification);
};

export const verifyLogin = async (req: Request, res: Response) => {
  const { phoneNumber, otp } = req.body;

  try {
    const status = await verifyOtp(phoneNumber, otp);

    res.status(200).send(status);
  } catch (error) {
    res.status(400).send(error);
  }
};
