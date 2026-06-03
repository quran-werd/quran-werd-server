import RevisionLog from "../models/RevisionLog";
import {
  getMaxOrder,
  getPlan,
  getWerdById,
} from "./revisionPlan.service";

const startOfToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfToday = (): Date => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

export type TodayWerdResponse = {
  werd: {
    _id: string;
    order: number;
    surah: number;
    range: { from: number; to: number };
  } | null;
  status: "pending" | "completed" | "skipped";
};

export const getTodayWerd = async (
  userId: string
): Promise<TodayWerdResponse> => {
  const plan = await getPlan(userId);
  if (!plan || plan.awrad.length === 0) {
    return { werd: null, status: "pending" };
  }

  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const todayLog = await RevisionLog.findOne({
    userId,
    date: { $gte: todayStart, $lte: todayEnd },
  }).sort({ date: -1 });

  if (todayLog) {
    const werd = plan.awrad.find(
      (w) => w._id === todayLog.werdId.toString()
    );
    if (werd) {
      return {
        werd,
        status: todayLog.status,
      };
    }
  }

  const lastCompleted = await RevisionLog.findOne({
    userId,
    status: "completed",
  }).sort({ date: -1 });

  let nextOrder = 1;
  if (lastCompleted) {
    const lastWerd = plan.awrad.find(
      (w) => w._id === lastCompleted.werdId.toString()
    );
    if (lastWerd) {
      nextOrder = lastWerd.order + 1;
    }
  }

  const maxOrder = await getMaxOrder(userId);
  if (nextOrder > maxOrder) {
    nextOrder = 1;
  }

  const lastSkipped = await RevisionLog.findOne({
    userId,
    status: "skipped",
    date: { $gte: todayStart, $lte: todayEnd },
  });

  if (lastSkipped) {
    const skippedWerd = plan.awrad.find(
      (w) => w._id === lastSkipped.werdId.toString()
    );
    if (skippedWerd) {
      return { werd: skippedWerd, status: "pending" };
    }
  }

  const nextWerd =
    plan.awrad.find((w) => w.order === nextOrder) || plan.awrad[0];

  return { werd: nextWerd, status: "pending" };
};

export const logComplete = async (userId: string, werdId: string) => {
  const werd = await getWerdById(userId, werdId);
  if (!werd) {
    throw new Error("Werd not found");
  }

  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const existing = await RevisionLog.findOne({
    userId,
    date: { $gte: todayStart, $lte: todayEnd },
  });

  if (existing) {
    existing.werdId = werdId as unknown as typeof existing.werdId;
    existing.status = "completed";
    await existing.save();
    return existing;
  }

  return RevisionLog.create({
    userId,
    werdId,
    status: "completed",
    date: new Date(),
  });
};

export const logSkip = async (userId: string, werdId: string) => {
  const werd = await getWerdById(userId, werdId);
  if (!werd) {
    throw new Error("Werd not found");
  }

  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const existing = await RevisionLog.findOne({
    userId,
    date: { $gte: todayStart, $lte: todayEnd },
  });

  if (existing) {
    existing.werdId = werdId as unknown as typeof existing.werdId;
    existing.status = "skipped";
    await existing.save();
    return existing;
  }

  return RevisionLog.create({
    userId,
    werdId,
    status: "skipped",
    date: new Date(),
  });
};
