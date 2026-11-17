import express from "express";
import { googleAuth, getMe, logout, updateMe } from "../controllers/auth/auth.controller";
import { jwtAuth } from "../middlewares/auth.middleware";

const authRouter = express.Router();

authRouter.post("/google", googleAuth);
authRouter.post("/logout", jwtAuth, logout);
authRouter.get("/me", jwtAuth, getMe);
authRouter.patch("/me", jwtAuth, updateMe);

export default authRouter;
