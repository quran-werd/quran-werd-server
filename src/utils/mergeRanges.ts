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

export const removeRangeFromSurahRanges = (
  existing: Range[],
  target: Range
): Range[] => {
  const result: Range[] = [];

  for (const range of existing) {
    if (range.from === target.from && range.to === target.to) {
      continue;
    }
    result.push(range);
  }

  return result;
};
