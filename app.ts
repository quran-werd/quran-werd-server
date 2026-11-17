import dotenv from "dotenv";
import app from "./src/routes";
import { connectDb, initQuranMaps } from "./src/services";

// configures dotenv to work in your application
dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

connectDb();

initQuranMaps()
  .then(() => {
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
  })
  .catch((error) => {
    console.error("Failed to initialize Quran maps:", error.message);
    process.exit(1);
  });
