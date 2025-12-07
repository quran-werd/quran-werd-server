import mongoose from "mongoose";
import Memorization, { IMemorization } from "../models/Memorization";
import {
  Memorization as MemorizationType,
  MemorizedRange,
} from "../types/memorization.type";

/**
 * Merges overlapping or adjacent ranges
 * @param ranges Array of ranges to merge (will be sorted and merged)
 * @returns Array of merged, non-overlapping ranges
 */
const mergeRanges = (ranges: MemorizedRange[]): MemorizedRange[] => {
  if (ranges.length === 0) return [];

  // Sort ranges by startVerse
  const sorted = [...ranges].sort((a, b) => a.startVerse - b.startVerse);

  const merged: MemorizedRange[] = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    // Check if ranges overlap or are adjacent
    // Adjacent: current.endVerse + 1 >= next.startVerse
    // Overlapping: current.endVerse >= next.startVerse
    if (current.endVerse + 1 >= next.startVerse) {
      // Merge: extend endVerse and sum wordsCount
      current.endVerse = Math.max(current.endVerse, next.endVerse);
      current.wordsCount += next.wordsCount;
    } else {
      // No overlap/adjacency: save current and start new
      merged.push(current);
      current = { ...next };
    }
  }

  // Don't forget the last range
  merged.push(current);

  return merged;
};

export const addMemorizedRanges = async (
  user_id: string,
  ranges: Array<{ chapterId: number } & MemorizedRange>
): Promise<IMemorization[]> => {
  const userId = new mongoose.Types.ObjectId(user_id);

  // Group new ranges by chapter
  const rangesByChapter = new Map<number, MemorizedRange[]>();
  for (const range of ranges) {
    if (!rangesByChapter.has(range.chapterId)) {
      rangesByChapter.set(range.chapterId, []);
    }
    rangesByChapter.get(range.chapterId)!.push({
      startVerse: range.startVerse,
      endVerse: range.endVerse,
      wordsCount: range.wordsCount,
    });
  }

  const allSavedMemorizations: IMemorization[] = [];

  // Process each chapter separately
  for (const [chapterNumber, newRanges] of rangesByChapter.entries()) {
    // Fetch existing ranges for this chapter
    const existingMemorizations = await Memorization.find({
      userId: userId,
      chapterNumber: chapterNumber,
    }).sort({ startVerse: 1 });

    // Convert existing to MemorizedRange format
    const existingRanges: MemorizedRange[] = existingMemorizations.map(
      (mem) => ({
        startVerse: mem.startVerse,
        endVerse: mem.endVerse,
        wordsCount: mem.wordsCount,
      })
    );

    // Combine existing and new ranges
    const allRanges = [...existingRanges, ...newRanges];

    // Merge all ranges
    const mergedRanges = mergeRanges(allRanges);

    // Delete old ranges for this chapter
    if (existingMemorizations.length > 0) {
      await Memorization.deleteMany({
        userId: userId,
        chapterNumber: chapterNumber,
      });
    }

    // Insert merged ranges
    if (mergedRanges.length > 0) {
      const memorizationsToInsert = mergedRanges.map((range) => ({
        userId: userId,
        chapterNumber: chapterNumber,
        startVerse: range.startVerse,
        endVerse: range.endVerse,
        wordsCount: range.wordsCount,
      }));

      const saved = await Memorization.insertMany(memorizationsToInsert);
      allSavedMemorizations.push(...saved);
    }
  }

  return allSavedMemorizations;
};

export const getMemorizations = async (
  user_id: string
): Promise<MemorizationType | undefined> => {
  const memorizations = await Memorization.find({ userId: user_id }).sort({
    chapterNumber: 1,
    startVerse: 1,
  });

  if (!memorizations || memorizations.length === 0) {
    return undefined;
  }

  // Group by chapter number
  const grouped: MemorizationType = {};
  for (const mem of memorizations) {
    if (!grouped[mem.chapterNumber]) {
      grouped[mem.chapterNumber] = [];
    }
    grouped[mem.chapterNumber].push({
      startVerse: mem.startVerse,
      endVerse: mem.endVerse,
      wordsCount: mem.wordsCount,
    });
  }

  return grouped;
};

export const getMemorizationByChapterNumber = async (
  user_id: string,
  chapter_number: number
): Promise<MemorizedRange[] | undefined> => {
  const memorizations = await Memorization.find({
    userId: user_id,
    chapterNumber: chapter_number,
  }).sort({ startVerse: 1 });

  if (!memorizations || memorizations.length === 0) {
    return undefined;
  }

  return memorizations.map((mem) => ({
    startVerse: mem.startVerse,
    endVerse: mem.endVerse,
    wordsCount: mem.wordsCount,
  }));
};

// Get total count of memorizations for all users (useful for analytics)
export const getTotalMemorizationsCount = async (): Promise<number> => {
  return await Memorization.countDocuments();
};

// Get count of memorizations for a specific user
export const getUserMemorizationsCount = async (
  user_id: string
): Promise<number> => {
  return await Memorization.countDocuments({ userId: user_id });
};

// Legacy function for backward compatibility (if needed)
export const addMemorizedRange = async (
  user_id: string,
  chapter_number: number,
  from: number,
  to: number
): Promise<IMemorization[]> => {
  return addMemorizedRanges(user_id, [
    {
      chapterId: chapter_number,
      startVerse: from,
      endVerse: to,
      wordsCount: 0, // Default to 0 for legacy calls
    },
  ]);
};
