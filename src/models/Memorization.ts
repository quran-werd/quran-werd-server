import mongoose, { Document, Schema } from "mongoose";

export type Range = {
  from: number;
  to: number;
};

export interface IMemorization extends Document {
  userId: mongoose.Types.ObjectId;
  ranges: Map<string, Range[]> | Record<string, Range[]>;
}

const RangeSchema = new Schema(
  {
    from: { type: Number, required: true },
    to: { type: Number, required: true },
  },
  { _id: false }
);

const MemorizationSchema: Schema<IMemorization> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    ranges: {
      type: Map,
      of: [RangeSchema],
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const Memorization = mongoose.model<IMemorization>(
  "Memorization",
  MemorizationSchema
);
export default Memorization;
