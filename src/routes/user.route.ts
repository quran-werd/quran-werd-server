import express from "express";
import { login, verifyLogin, logout, refresh } from "../services";
import { jwtAuth } from "../middlewares/auth.middleware";
var userRouter = express.Router();

userRouter.post("/login", login);
userRouter.post("/login/verify", verifyLogin);
userRouter.post("/refresh", refresh);
userRouter.post("/logout", jwtAuth, logout);

export default userRouter;
