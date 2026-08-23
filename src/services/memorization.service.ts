import Memorization, { Range, buildRangeId } from "../models/Memorization";
import {
  addRangeToSurahRanges,
  subtractRangeFromRanges,
} from "../utils/mergeRanges";
import { validateRange } from "../utils/quranMetadata";

export type MemorizationData = {
  _id: string;
  userId: string;
  ranges: Record<string, Range[]>;
};

const rangesMapToObject = (
  ranges: Map<string, Range[]> | Record<string, Range[]>,
): Record<string, Range[]> => {
  if (ranges instanceof Map) {
    const obj: Record<string, Range[]> = {};
    ranges.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
  return { ...ranges };
};

const toMemorizationData = (doc: {
  id: string;
  userId: { toString(): string };
  ranges: Map<string, Range[]> | Record<string, Range[]>;
}): MemorizationData => ({
  _id: doc.id,
  userId: doc.userId.toString(),
  ranges: rangesMapToObject(doc.ranges),
});

const toUniqueRanges = (
  surah: number,
  ranges: Array<{ from: number; to: number }>,
): Range[] => {
  const seen = new Set<string>();

  return ranges.reduce<Range[]>((unique, range) => {
    const rangeId = buildRangeId(surah, range.from, range.to);
    if (seen.has(rangeId)) {
      return unique;
    }

    seen.add(rangeId);
    unique.push({ rangeId, from: range.from, to: range.to });
    return unique;
  }, []);
};

export const getOrCreateMemorization = async (userId: string) => {
  let doc = await Memorization.findOne({ userId });
  if (!doc) {
    doc = await Memorization.create({ userId, ranges: {} });
  }
  return doc;
};

export const getMemorizations = async (
  userId: string,
): Promise<MemorizationData> => {
  const doc = await getOrCreateMemorization(userId);
  return toMemorizationData(doc as Parameters<typeof toMemorizationData>[0]);
};

export type RangeInput = {
  surah: number;
  from: number;
  to: number;
};

export type AddRangeResult = RangeInput & { merged: boolean };

const totalAyahCount = (rangesObj: Record<string, Range[]>): number =>
  Object.values(rangesObj).reduce(
    (sum, surahRanges) =>
      sum + surahRanges.reduce((s, r) => s + (r.to - r.from + 1), 0),
    0,
  );

export const addRanges = async (
  userId: string,
  ranges: RangeInput[],
): Promise<{
  data: MemorizationData;
  results: AddRangeResult[];
  changed: boolean;
}> => {
  ranges.forEach(({ surah, from, to }, index) => {
    const validationError = validateRange(surah, from, to);
    if (validationError) {
      throw new Error(
        `ranges[${index}] (surah ${surah}, ${from}–${to}): ${validationError}`,
      );
    }
  });

  const doc = await getOrCreateMemorization(userId);
  const rangesObj = rangesMapToObject(doc.ranges);
  const beforeAyahCount = totalAyahCount(rangesObj);
  const results: AddRangeResult[] = [];

  for (const { surah, from, to } of ranges) {
    const surahKey = String(surah);
    const existing = (rangesObj[surahKey] || []).map(({ from: rangeFrom, to: rangeTo }) => ({
      from: rangeFrom,
      to: rangeTo,
    }));
    const beforeCount = existing.length;
    const mergedRanges = addRangeToSurahRanges(existing, { from, to });
    const merged = mergedRanges.length < beforeCount + 1;

    rangesObj[surahKey] = toUniqueRanges(surah, mergedRanges);
    results.push({ surah, from, to, merged });
  }

  const changed = totalAyahCount(rangesObj) > beforeAyahCount;

  doc.ranges = rangesObj as unknown as Map<string, Range[]>;
  doc.markModified("ranges");
  await doc.save();

  return {
    data: toMemorizationData(doc as Parameters<typeof toMemorizationData>[0]),
    results,
    changed,
  };
};

export const deleteRange = async (
  userId: string,
  surah: number,
  from: number,
  to: number,
): Promise<{ data: MemorizationData; changed: boolean }> => {
  const validationError = validateRange(surah, from, to);
  if (validationError) {
    throw new Error(validationError);
  }

  const doc = await getOrCreateMemorization(userId);

  const rangesObj = rangesMapToObject(doc.ranges);
  const surahKey = String(surah);
  const existing = rangesObj[surahKey] || [];
  const updated = subtractRangeFromRanges(
    existing.map(({ from: rangeFrom, to: rangeTo }) => ({
      from: rangeFrom,
      to: rangeTo,
    })),
    { from, to },
  );

  const existingAyahCount = existing.reduce(
    (sum, range) => sum + (range.to - range.from + 1),
    0,
  );
  const updatedAyahCount = updated.reduce(
    (sum, range) => sum + (range.to - range.from + 1),
    0,
  );
  const changed = updatedAyahCount < existingAyahCount;

  if (!changed) {
    return {
      data: toMemorizationData(doc as Parameters<typeof toMemorizationData>[0]),
      changed: false,
    };
  }

  if (updated.length === 0) {
    delete rangesObj[surahKey];
  } else {
    rangesObj[surahKey] = toUniqueRanges(surah, updated);
  }

  doc.ranges = rangesObj as unknown as Map<string, Range[]>;
  doc.markModified("ranges");
  await doc.save();

  return {
    data: toMemorizationData(doc as Parameters<typeof toMemorizationData>[0]),
    changed: true,
  };
};

export const getAllRangesFlat = (
  ranges: Record<string, Range[]>,
): Array<{ surah: number; from: number; to: number }> => {
  const result: Array<{ surah: number; from: number; to: number }> = [];
  for (const [surahKey, surahRanges] of Object.entries(ranges)) {
    const surah = Number(surahKey);
    for (const range of surahRanges) {
      result.push({ surah, from: range.from, to: range.to });
    }
  }
  return result.sort((a, b) => a.surah - b.surah || a.from - b.from);
};
