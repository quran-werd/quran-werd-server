import RevisionPlan, { IRevisionPlan } from "../models/RevisionPlan";
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

const rangesOverlap = (
  a: { from: number; to: number },
  b: { from: number; to: number }
): boolean => a.from <= b.to && b.from <= a.to;

const rebuildIncompleteAwrad = async (
  plan: IRevisionPlan
): Promise<void> => {
  const memorizations = await getMemorizations(plan.userId.toString());
  const allRanges = getAllRangesFlat(memorizations.ranges);

  const remaining = subtractCompletedFromRanges(
    allRanges,
    plan.completedAwrad as unknown as Array<{
      surah: number;
      range: { from: number; to: number };
    }>
  );

  plan.incompleteAwrad = generateAwrad(
    remaining,
    plan.dailyCapacity
  ) as unknown as typeof plan.incompleteAwrad;
  await plan.save();
};

export const resyncIncompleteAfterMemorizationDelete = async (
  userId: string,
  surah: number,
  from: number,
  to: number
): Promise<boolean> => {
  const plan = await RevisionPlan.findOne({ userId });
  if (!plan) return false;

  const overlapsIncomplete = plan.incompleteAwrad.some(
    (werd) =>
      werd.surah === surah &&
      rangesOverlap(
        { from: werd.range.from, to: werd.range.to },
        { from, to }
      )
  );
  if (!overlapsIncomplete) return false;

  await rebuildIncompleteAwrad(plan);

  return true;
};

export const resyncIncompleteAfterMemorizationAdd = async (
  userId: string
): Promise<boolean> => {
  const plan = await RevisionPlan.findOne({ userId });
  if (!plan) return false;

  await rebuildIncompleteAwrad(plan);

  return true;
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

export type CurrentWerd = { werd: WerdData; isCompleted: boolean };

export type CurrentAndNextWerdResponse = {
  current: CurrentWerd | null;
  next: WerdData | null;
  planStatus: "active" | "finished" | "no-plan";
};

export const getCurrentAndNextWerd = async (
  userId: string
): Promise<CurrentAndNextWerdResponse> => {
  const plan = await RevisionPlan.findOne({ userId });
  if (!plan) {
    return { current: null, next: null, planStatus: "no-plan" };
  }

  const planStatus = plan.incompleteAwrad.length === 0 ? "finished" : "active";

  const lastCompleted = plan.completedAwrad[plan.completedAwrad.length - 1];
  if (lastCompleted && isToday(lastCompleted.completedAt)) {
    const next = plan.incompleteAwrad[0]
      ? toWerdData(plan.incompleteAwrad[0] as unknown as WerdDoc)
      : null;
    return {
      current: {
        werd: toCompletedWerdData(lastCompleted as unknown as CompletedWerdDoc),
        isCompleted: true,
      },
      next,
      planStatus,
    };
  }

  const front = plan.incompleteAwrad[0];
  if (!front) {
    return { current: null, next: null, planStatus };
  }

  const nextInQueue = plan.incompleteAwrad[1];
  return {
    current: {
      werd: toWerdData(front as unknown as WerdDoc),
      isCompleted: false,
    },
    next: nextInQueue ? toWerdData(nextInQueue as unknown as WerdDoc) : null,
    planStatus,
  };
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
