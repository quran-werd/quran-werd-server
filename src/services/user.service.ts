import { Request, Response } from "express";
import User from "../models/User";

// Example: Creating a new user
export const createUser = async (req: Request, res: Response) => {
  console.log(1111, "Yaaay");
  const user = new User({
    phone: "0785352060",
    memorizations: [],
  });

  await user.save();
  console.log("User created:", user);

  res.sendStatus(200);
};

export const getUser = async (req: Request, res: Response) => {
  const user = await User.findOne();
  res.sendStatus(200).json(user);
};
