import mongoose, { Document, Schema } from "mongoose";

export type WerdRange = {
  from: number;
  to: number;
};

export type Werd = {
  _id?: mongoose.Types.ObjectId;
  order: number;
  surah: number;
  range: WerdRange;
};

export type CompletedWerd = Werd & {
  completedAt: Date;
};

export interface IRevisionPlan extends Document {
  userId: mongoose.Types.ObjectId;
  dailyCapacity: number;
  incompleteAwrad: Werd[];
  completedAwrad: CompletedWerd[];
}

const WerdRangeSchema = new Schema(
  {
    from: { type: Number, required: true },
    to: { type: Number, required: true },
  },
  { _id: false }
);

const WerdSchema = new Schema(
  {
    order: { type: Number, required: true },
    surah: { type: Number, required: true },
    range: { type: WerdRangeSchema, required: true },
  },
  { _id: true }
);

const CompletedWerdSchema = new Schema(
  {
    order: { type: Number, required: true },
    surah: { type: Number, required: true },
    range: { type: WerdRangeSchema, required: true },
    completedAt: { type: Date, required: true },
  },
  { _id: true }
);

const RevisionPlanSchema: Schema<IRevisionPlan> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    dailyCapacity: { type: Number, required: true },
    incompleteAwrad: { type: [WerdSchema], default: [] },
    completedAwrad: { type: [CompletedWerdSchema], default: [] },
  },
  { timestamps: true }
);

const RevisionPlan = mongoose.model<IRevisionPlan>(
  "RevisionPlan",
  RevisionPlanSchema
);
export default RevisionPlan;
