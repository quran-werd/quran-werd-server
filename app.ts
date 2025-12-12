import dotenv from "dotenv";
import app from "./src/routes";
import { connectDb } from "./src/services";

// configures dotenv to work in your application
dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

connectDb();

app
  .listen(PORT, "0.0.0.0", () => {
    console.log("Server running at PORT: ", PORT);
    console.log(
      "Server accessible from network at: http://<your-local-ip>:" + PORT
    );
  })
  .on("error", (error) => {
    // gracefully handle error
    throw new Error(error.message);
  });
