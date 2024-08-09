import mongoose, { Schema, Document } from "mongoose";

// Define interface for MemorizedChapter
interface IMemorizedChapter extends Document {
  chapter_number: number;
  verses: mongoose.Types.ObjectId[];
}

// Create schema for MemorizedChapter
const MemorizedChapterSchema: Schema<IMemorizedChapter> = new Schema(
  {
    chapter_number: {
      type: Number,
      required: true,
    },
    verses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Verse",
      },
    ],
  },
  { _id: false }
);

export { IMemorizedChapter, MemorizedChapterSchema };
