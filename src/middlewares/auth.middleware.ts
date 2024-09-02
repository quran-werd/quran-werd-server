import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { JWTPayload } from "../services/jwt.service";

dotenv.config();

const jwtSecretKey = process.env.JWT_SECRET_KEY || "";

export const jwtAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (token) {
    jwt.verify(token, jwtSecretKey, (err, payload) => {
      if (err || typeof payload === "string") {
        return res.sendStatus(403); // Forbidden
      }

      req.userId = (payload as JWTPayload).userId;

      next();
    });
  } else {
    res.sendStatus(401); // Unauthorized
  }
};
