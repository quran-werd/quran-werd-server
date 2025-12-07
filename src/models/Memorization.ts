import mongoose, { Document, Schema } from "mongoose";

// Define interface for Memorization
export interface IMemorization extends Document {
  userId: mongoose.Types.ObjectId;
  chapterNumber: number;
  startVerse: number;
  endVerse: number;
  wordsCount: number;
}

// Create schema for Memorization
const MemorizationSchema: Schema<IMemorization> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for faster queries
    },
    chapterNumber: {
      type: Number,
      required: true,
      index: true, // Index for faster queries by chapter
    },
    startVerse: {
      type: Number,
      required: true,
    },
    endVerse: {
      type: Number,
      required: true,
    },
    wordsCount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Compound index for efficient queries (user + chapter)
MemorizationSchema.index({ userId: 1, chapterNumber: 1 });

// Create and export the Memorization model
const Memorization = mongoose.model<IMemorization>("Memorization", MemorizationSchema);
export default Memorization;

