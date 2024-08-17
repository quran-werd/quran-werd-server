import dotevn from "dotenv";

const twilio = require("twilio");

dotevn.config();

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SERVICE_SID } = process.env;
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export const sendOtp = async (phoneNumber: number) => {
  const verification = await client.verify.v2.services(TWILIO_SERVICE_SID).verifications.create({ to: phoneNumber, channel: "sms" });

  return verification;
};

export const verifyOtp = async (phoneNumber: number, otp: number) => {
  const verificationCheck = await client.verify.v2.services(TWILIO_SERVICE_SID).verificationChecks.create({
    code: otp,
    to: phoneNumber,
  });

  return verificationCheck;
};
