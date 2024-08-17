import express from "express";
import { login, verifyLogin } from "../services";

var userRouter = express.Router();

userRouter.post("/login", login);
userRouter.post("/login/verify", verifyLogin);

export default userRouter;
