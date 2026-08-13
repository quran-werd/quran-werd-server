import { Werd } from "../models/RevisionPlan";
import { AYAH_MAP, PAGE_MAP } from "../services/quran.service";

type InputRange = {
  surah: number;
  from: number;
  to: number;
};

type PageSegment = {
  surah: number;
  from: number;
  to: number;
};

const pageSegmentsForRange = ({
  surah,
  from,
  to,
}: InputRange): PageSegment[] => {
  const segments: PageSegment[] = [];
  let ayah = from;

  while (ayah <= to) {
    const meta = AYAH_MAP[`${surah}:${ayah}`];
    if (!meta) {
      throw new Error(`No page metadata for ${surah}:${ayah}`);
    }

    const pageRange = PAGE_MAP[meta.page]?.find((r) => r.surah === surah);
    if (!pageRange) {
      throw new Error(
        `No page range for surah ${surah} on page ${meta.page}`
      );
    }

    const segmentEnd = Math.min(pageRange.end, to);
    segments.push({ surah, from: ayah, to: segmentEnd });
    ayah = segmentEnd + 1;
  }

  return segments;
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

  for (const range of ranges) {
    const segments = pageSegmentsForRange(range);
    for (let i = 0; i < segments.length; i += dailyCapacity) {
      const batch = segments.slice(i, i + dailyCapacity);
      awrad.push({
        order: order++,
        surah: range.surah,
        range: { from: batch[0].from, to: batch[batch.length - 1].to },
      });
    }
  }

  return awrad;
};
