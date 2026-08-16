export type Range = {
  from: number;
  to: number;
};

export const mergeRanges = (ranges: Range[]): Range[] => {
  if (ranges.length === 0) return [];

  const sorted = [...ranges].sort((a, b) => a.from - b.from);
  const merged: Range[] = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    if (current.to + 1 >= next.from) {
      current.to = Math.max(current.to, next.to);
    } else {
      merged.push(current);
      current = { ...next };
    }
  }

  merged.push(current);
  return merged;
};

export const addRangeToSurahRanges = (
  existing: Range[],
  newRange: Range
): Range[] => mergeRanges([...existing, newRange]);

export const subtractRangeFromRanges = (
  ranges: Range[],
  remove: Range
): Range[] => {
  const result: Range[] = [];

  for (const range of ranges) {
    if (remove.to < range.from || remove.from > range.to) {
      result.push(range);
      continue;
    }
    if (remove.from > range.from) {
      result.push({ from: range.from, to: remove.from - 1 });
    }
    if (remove.to < range.to) {
      result.push({ from: remove.to + 1, to: range.to });
    }
  }

  return result;
};
