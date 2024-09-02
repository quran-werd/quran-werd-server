export type Memorization = {
  [chapter: number]: MemorizedVersesRange[];
};

export type MemorizedVersesRange = { from: number; to: number };
