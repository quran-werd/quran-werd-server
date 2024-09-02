import express, { Request, Response } from "express";
import memorizationRouter from "./memorization.route";
import userRouter from "./user.route";

const app = express();

app.use(express.json());

app.get("/", (request: Request, response: Response) => {
  response.status(200).send("Hello World");
});

app.use("/users", userRouter);
app.use("/memorizations", memorizationRouter);

export default app;
