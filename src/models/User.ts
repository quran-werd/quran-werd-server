import mongoose, { Document, Schema } from "mongoose";

// Define interface for User
export interface IUser extends Document {
  phone: string;
  refreshToken?: string;
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
    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the User model
const User = mongoose.model<IUser>("User", UserSchema);
export default User;
