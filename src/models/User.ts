import mongoose, { Document, Schema } from "mongoose";
import { Memorization } from "../types/memorization.type";

// Define interface for User
export interface IUser extends Document {
  phone: string;
  memorizations: Memorization;
}

// Create schema for User
const UserSchema: Schema<IUser> = new Schema(
  {
    phone: {
      type: String,
      index: true,
      unique: true,
      required: true,
    },
    memorizations: {
      type: Object,
      of: [
        {
          from: { type: Number, required: true },
          to: { type: Number, required: true },
        },
      ],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the User model
const User = mongoose.model<IUser>("User", UserSchema);
export default User;
