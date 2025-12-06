export type MemorizedRange = {
  startVerse: number;
  endVerse: number;
  wordsCount: number;
};

export type Memorization = {
  [chapter_number: number]: MemorizedRange[];
};

// Legacy type for backward compatibility (if needed)
export type MemorizedVersesRange = { from: number; to: number };
