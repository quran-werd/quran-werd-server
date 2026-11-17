import mongoose, { ConnectOptions } from "mongoose";

export const connectDb = async () => {
  mongoose
    .connect(process.env.MONGODB_URI as string, {} as ConnectOptions)
    .then(() => console.log("MongoDB connection established."))
    .catch((error) =>
      console.error("MongoDB connection failed:", error.message),
    );
};
