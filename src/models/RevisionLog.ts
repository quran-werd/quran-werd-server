import mongoose, { Document, Schema } from "mongoose";

export type RevisionLogStatus = "completed" | "skipped";

export interface IRevisionLog extends Document {
  userId: mongoose.Types.ObjectId;
  werdId: mongoose.Types.ObjectId;
  status: RevisionLogStatus;
  date: Date;
}

const RevisionLogSchema: Schema<IRevisionLog> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    werdId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    status: {
      type: String,
      enum: ["completed", "skipped"],
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

RevisionLogSchema.index({ userId: 1, date: 1 });

const RevisionLog = mongoose.model<IRevisionLog>(
  "RevisionLog",
  RevisionLogSchema
);
export default RevisionLog;
