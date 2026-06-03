import express, { Request, Response } from "express";
import morgan from "morgan";
import authRouter from "./auth.route";
import memorizationRouter from "./memorization.route";
import revisionPlanRouter from "./revisionPlan.route";
import revisionLogRouter from "./revisionLog.route";

const app = express();

app.use(morgan("dev"));
app.use(express.json());

app.get("/", (_request: Request, response: Response) => {
  response.status(200).send("Hello World");
});

app.use("/auth", authRouter);
app.use("/memorizations", memorizationRouter);
app.use("/revision-plan", revisionPlanRouter);
app.use("/revision-log", revisionLogRouter);

export default app;
