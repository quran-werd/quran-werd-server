import RevisionPlan from "../models/RevisionPlan";
import { generateAwrad } from "../utils/generatePlan";
import { subtractRangeFromRanges } from "../utils/mergeRanges";
import { getAllRangesFlat, getMemorizations } from "./memorization.service";

export type WerdData = {
  _id: string;
  order: number;
  surah: number;
  range: { from: number; to: number };
};

export type CompletedWerdData = WerdData & { completedAt: string };

export type PlanData = {
  _id: string;
  userId: string;
  dailyCapacity: number;
  incompleteAwrad: WerdData[];
  completedAwrad: CompletedWerdData[];
};

type WerdDoc = {
  _id?: { toString(): string };
  id?: string;
  order: number;
  surah: number;
  range: { from: number; to: number };
};

type CompletedWerdDoc = WerdDoc & { completedAt: Date };

const toWerdData = (w: WerdDoc): WerdData => ({
  _id: w._id?.toString() || w.id || "",
  order: w.order,
  surah: w.surah,
  range: { from: w.range.from, to: w.range.to },
});

const toCompletedWerdData = (w: CompletedWerdDoc): CompletedWerdData => ({
  ...toWerdData(w),
  completedAt: w.completedAt.toISOString(),
});

const toPlanData = (doc: {
  id: string;
  userId: { toString(): string };
  dailyCapacity: number;
  incompleteAwrad: WerdDoc[];
  completedAwrad: CompletedWerdDoc[];
}): PlanData => ({
  _id: doc.id,
  userId: doc.userId.toString(),
  dailyCapacity: doc.dailyCapacity,
  incompleteAwrad: doc.incompleteAwrad.map(toWerdData),
  completedAwrad: doc.completedAwrad.map(toCompletedWerdData),
});

const isToday = (date: Date): boolean => {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const subtractCompletedFromRanges = (
  allRanges: Array<{ surah: number; from: number; to: number }>,
  completedAwrad: Array<{ surah: number; range: { from: number; to: number } }>
): Array<{ surah: number; from: number; to: number }> => {
  const bySurah = new Map<number, { from: number; to: number }[]>();
  for (const r of allRanges) {
    const list = bySurah.get(r.surah) || [];
    list.push({ from: r.from, to: r.to });
    bySurah.set(r.surah, list);
  }

  for (const werd of completedAwrad) {
    const list = bySurah.get(werd.surah);
    if (!list) continue;
    bySurah.set(
      werd.surah,
      subtractRangeFromRanges(list, {
        from: werd.range.from,
        to: werd.range.to,
      })
    );
  }

  const result: Array<{ surah: number; from: number; to: number }> = [];
  for (const [surah, ranges] of bySurah) {
    for (const r of ranges) {
      result.push({ surah, from: r.from, to: r.to });
    }
  }
  return result.sort((a, b) => a.surah - b.surah || a.from - b.from);
};

export const getPlan = async (userId: string): Promise<PlanData | null> => {
  const plan = await RevisionPlan.findOne({ userId });
  if (!plan) return null;
  return toPlanData(plan as unknown as Parameters<typeof toPlanData>[0]);
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

  const incompleteAwrad = generateAwrad(flatRanges, dailyCapacity);

  let plan = await RevisionPlan.findOne({ userId });
  if (plan) {
    plan.dailyCapacity = dailyCapacity;
    plan.incompleteAwrad =
      incompleteAwrad as unknown as typeof plan.incompleteAwrad;
    plan.completedAwrad = [] as unknown as typeof plan.completedAwrad;
    await plan.save();
  } else {
    plan = await RevisionPlan.create({
      userId,
      dailyCapacity,
      incompleteAwrad,
      completedAwrad: [],
    });
  }

  return toPlanData(plan as unknown as Parameters<typeof toPlanData>[0]);
};

export const updateCapacity = async (
  userId: string,
  dailyCapacity: number
): Promise<PlanData> => {
  if (!Number.isInteger(dailyCapacity) || dailyCapacity < 1) {
    throw new Error("dailyCapacity must be a positive integer");
  }

  const plan = await RevisionPlan.findOne({ userId });
  if (!plan) {
    throw new Error("Plan not found");
  }

  const memorizations = await getMemorizations(userId);
  const allRanges = getAllRangesFlat(memorizations.ranges);

  if (allRanges.length === 0) {
    throw new Error("No memorized ranges found");
  }

  const remaining = subtractCompletedFromRanges(
    allRanges,
    plan.completedAwrad as unknown as Array<{
      surah: number;
      range: { from: number; to: number };
    }>
  );

  plan.dailyCapacity = dailyCapacity;
  if (remaining.length === 0) {
    plan.completedAwrad = [] as unknown as typeof plan.completedAwrad;
    plan.incompleteAwrad = generateAwrad(
      allRanges,
      dailyCapacity
    ) as unknown as typeof plan.incompleteAwrad;
  } else {
    plan.incompleteAwrad = generateAwrad(
      remaining,
      dailyCapacity
    ) as unknown as typeof plan.incompleteAwrad;
  }

  await plan.save();

  return toPlanData(plan as unknown as Parameters<typeof toPlanData>[0]);
};

export type TodayWerdResponse = {
  werd: WerdData | CompletedWerdData | null;
  status: "pending" | "completed" | "finished";
};

export const getTodayWerd = async (
  userId: string
): Promise<TodayWerdResponse> => {
  const plan = await RevisionPlan.findOne({ userId });
  if (!plan) {
    return { werd: null, status: "pending" };
  }

  if (plan.incompleteAwrad.length === 0) {
    const last = plan.completedAwrad[plan.completedAwrad.length - 1];
    return {
      werd: last
        ? toCompletedWerdData(last as unknown as CompletedWerdDoc)
        : null,
      status: "finished",
    };
  }

  const lastCompleted = plan.completedAwrad[plan.completedAwrad.length - 1];
  if (lastCompleted && isToday(lastCompleted.completedAt)) {
    return {
      werd: toCompletedWerdData(lastCompleted as unknown as CompletedWerdDoc),
      status: "completed",
    };
  }

  const front = plan.incompleteAwrad[0];
  return {
    werd: toWerdData(front as unknown as WerdDoc),
    status: "pending",
  };
};

export const getNextWerd = async (
  userId: string
): Promise<WerdData | null> => {
  const plan = await RevisionPlan.findOne({ userId });
  if (!plan || plan.incompleteAwrad.length === 0) {
    return null;
  }

  return toWerdData(plan.incompleteAwrad[0] as unknown as WerdDoc);
};

export const completeWerd = async (
  userId: string,
  werdId: string
): Promise<{ werd: CompletedWerdData; alreadyCompleted: boolean }> => {
  const plan = await RevisionPlan.findOne({ userId });
  if (!plan) {
    throw new Error("Plan not found");
  }

  const front = plan.incompleteAwrad[0];

  if (front && (front._id?.toString() || "") === werdId) {
    plan.incompleteAwrad.shift();
    plan.completedAwrad.push({
      order: front.order,
      surah: front.surah,
      range: { from: front.range.from, to: front.range.to },
      completedAt: new Date(),
    } as unknown as (typeof plan.completedAwrad)[number]);

    await plan.save();

    const saved = plan.completedAwrad[plan.completedAwrad.length - 1];
    return {
      werd: toCompletedWerdData(saved as unknown as CompletedWerdDoc),
      alreadyCompleted: false,
    };
  }

  const lastCompleted = plan.completedAwrad[plan.completedAwrad.length - 1];
  if (lastCompleted && (lastCompleted._id?.toString() || "") === werdId) {
    return {
      werd: toCompletedWerdData(lastCompleted as unknown as CompletedWerdDoc),
      alreadyCompleted: true,
    };
  }

  throw new Error("Werd not found");
};
