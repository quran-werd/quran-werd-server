import dotenv from "dotenv";
import app from "./src/routes";
import { connectDb } from "./src/services";

// configures dotenv to work in your application
dotenv.config();

const PORT = process.env.PORT;

connectDb();

app
  .listen(PORT, () => {
    console.log("Server running at PORT: ", PORT);
  })
  .on("error", (error) => {
    // gracefully handle error
    throw new Error(error.message);
  });
