import express, { Request, Response } from "express";
import morgan from "morgan";
import memorizationRouter from "./memorization.route";
import userRouter from "./user.route";

const app = express();

// Logging middleware
app.use(morgan("dev"));

app.use(express.json());

app.get("/", (request: Request, response: Response) => {
  response.status(200).send("Hello World");
});

app.use("/users", userRouter);
app.use("/memorizations", memorizationRouter);

export default app;
