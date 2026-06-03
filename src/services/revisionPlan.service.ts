import RevisionPlan from "../models/RevisionPlan";
import { generateAwrad } from "../utils/generatePlan";
import {
  getAllRangesFlat,
  getMemorizations,
} from "./memorization.service";

export type PlanData = {
  _id: string;
  userId: string;
  dailyCapacity: number;
  awrad: Array<{
    _id: string;
    order: number;
    surah: number;
    range: { from: number; to: number };
  }>;
};

const toPlanData = (doc: {
  id: string;
  userId: { toString(): string };
  dailyCapacity: number;
  awrad: Array<{
    _id?: { toString(): string };
    id?: string;
    order: number;
    surah: number;
    range: { from: number; to: number };
  }>;
}): PlanData => ({
  _id: doc.id,
  userId: doc.userId.toString(),
  dailyCapacity: doc.dailyCapacity,
  awrad: doc.awrad.map((w) => ({
    _id: w._id?.toString() || w.id || "",
    order: w.order,
    surah: w.surah,
    range: { from: w.range.from, to: w.range.to },
  })),
});

export const getPlan = async (userId: string): Promise<PlanData | null> => {
  const plan = await RevisionPlan.findOne({ userId });
  if (!plan) return null;
  return toPlanData(plan as Parameters<typeof toPlanData>[0]);
};

export const generatePlan = async (
  userId: string,
  dailyCapacity: number
): Promise<PlanData> => {
  if (!Number.isInteger(dailyCapacity) || dailyCapacity < 1) {
    throw new Error("dailyCapacity must be a positive integer");
  }

  const memorizations = await getMemorizations(userId);
  const flatRanges = getAllRangesFlat(memorizations.ranges);

  if (flatRanges.length === 0) {
    throw new Error("No memorized ranges found");
  }

  const awrad = generateAwrad(flatRanges, dailyCapacity);

  let plan = await RevisionPlan.findOne({ userId });
  if (plan) {
    plan.dailyCapacity = dailyCapacity;
    plan.awrad = awrad as unknown as typeof plan.awrad;
    await plan.save();
  } else {
    plan = await RevisionPlan.create({
      userId,
      dailyCapacity,
      awrad,
    });
  }

  return toPlanData(plan as Parameters<typeof toPlanData>[0]);
};

export const updateCapacity = async (
  userId: string,
  dailyCapacity: number
): Promise<PlanData> => {
  const existing = await RevisionPlan.findOne({ userId });
  if (!existing) {
    throw new Error("Plan not found");
  }
  return generatePlan(userId, dailyCapacity);
};

export const getWerdById = async (userId: string, werdId: string) => {
  const plan = await RevisionPlan.findOne({ userId });
  if (!plan) return null;
  const werd = plan.awrad.find(
    (w) => (w._id?.toString() || "") === werdId
  );
  if (!werd || !werd._id) return null;
  return {
    _id: werd._id.toString(),
    order: werd.order,
    surah: werd.surah,
    range: { from: werd.range.from, to: werd.range.to },
  };
};

export const getMaxOrder = async (userId: string): Promise<number> => {
  const plan = await RevisionPlan.findOne({ userId });
  if (!plan || plan.awrad.length === 0) return 0;
  return Math.max(...plan.awrad.map((w) => w.order));
};
