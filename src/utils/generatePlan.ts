import { Werd } from "../models/RevisionPlan";

type InputRange = {
  surah: number;
  from: number;
  to: number;
};

export const generateAwrad = (
  ranges: InputRange[],
  dailyCapacity: number
): Omit<Werd, "_id">[] => {
  if (dailyCapacity < 1) {
    throw new Error("dailyCapacity must be at least 1");
  }

  const awrad: Omit<Werd, "_id">[] = [];
  let order = 1;

  for (const { surah, from, to } of ranges) {
    let start = from;
    while (start <= to) {
      const end = Math.min(start + dailyCapacity - 1, to);
      awrad.push({
        order: order++,
        surah,
        range: { from: start, to: end },
      });
      start = end + 1;
    }
  }

  return awrad;
};
