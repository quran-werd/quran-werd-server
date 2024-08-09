import express from "express";
import { createUser } from "../services";

var userRouter = express.Router();

userRouter.get("/", createUser);
userRouter.post("/create", createUser);

export default userRouter;
