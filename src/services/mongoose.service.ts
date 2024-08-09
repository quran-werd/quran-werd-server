import mongoose, { ConnectOptions } from "mongoose";

export const connectDb = async () => {
  mongoose
    .connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.wmqb3gf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`, {} as ConnectOptions)
    .then(() => console.log("MongoDB connection established."))
    .catch((error) => console.error("MongoDB connection failed:", error.message));
};
