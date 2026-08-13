import fs from "fs";
import path from "path";
import { createServerClient } from "@quranjs/api/server";

// All page numbers here follow the QDC mushafId 2 layout (Hafs, Uthmani,
// 15-line Madani mushaf, 604 pages) — the only mushaf this app supports.
// The SDK's default `pageNumber`/`pages` fields already reflect that layout.

export interface AyahMeta {
  surah: number;
  ayah: number;
  page: number;
}

export interface SurahMeta {
  surah: number;
  startPage: number;
  endPage: number;
  ayahCount: number;
  type: "meccan" | "medinan";
}

export interface PageSurahRange {
  surah: number;
  start: number;
  end: number;
}

export const AYAH_MAP: Record<string, AyahMeta> = {};
export const SURAH_MAP: Record<number, SurahMeta> = {};
export const PAGE_MAP: Record<number, PageSurahRange[]> = {};

const CACHE_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "quranMaps.mushaf2.cache.json",
);

interface QuranMapsCache {
  ayahMap: Record<string, AyahMeta>;
  surahMap: Record<number, SurahMeta>;
  pageMap: Record<number, PageSurahRange[]>;
}

let initialized = false;

const populateFrom = (cache: QuranMapsCache) => {
  Object.assign(AYAH_MAP, cache.ayahMap);
  Object.assign(SURAH_MAP, cache.surahMap);
  Object.assign(PAGE_MAP, cache.pageMap);
};

const buildPageMap = () => {
  const byPage = new Map<number, Map<number, { start: number; end: number }>>();

  for (const { surah, ayah, page } of Object.values(AYAH_MAP)) {
    if (!byPage.has(page)) byPage.set(page, new Map());
    const bySurah = byPage.get(page) as Map<number, { start: number; end: number }>;
    const range = bySurah.get(surah);
    if (!range) {
      bySurah.set(surah, { start: ayah, end: ayah });
    } else {
      range.start = Math.min(range.start, ayah);
      range.end = Math.max(range.end, ayah);
    }
  }

  for (const [page, bySurah] of byPage) {
    PAGE_MAP[page] = Array.from(bySurah.entries())
      .sort(([surahA], [surahB]) => surahA - surahB)
      .map(([surah, range]) => ({ surah, ...range }));
  }
};

const fetchFresh = async () => {
  const client = createServerClient({
    clientId: process.env.QURAN_FOUNDATION_CLIENT_ID as string,
    clientSecret: process.env.QURAN_FOUNDATION_CLIENT_SECRET as string,
    services: {
      // Prelive credentials only work against the prelive hosts — tokens
      // issued by one environment are rejected by the other.
      gatewayUrl:
        process.env.QURAN_FOUNDATION_GATEWAY_URL ??
        "https://apis-prelive.quran.foundation",
      oauth2BaseUrl:
        process.env.QURAN_FOUNDATION_OAUTH2_URL ??
        "https://prelive-oauth2.quran.foundation",
    },
  });

  const chapters = await client.chapters.findAll();

  for (const chapter of chapters) {
    const [startPage, endPage] = chapter.pages;
    SURAH_MAP[chapter.id] = {
      surah: chapter.id,
      startPage,
      endPage,
      ayahCount: chapter.versesCount,
      type: chapter.revelationPlace === "makkah" ? "meccan" : "medinan",
    };

    const verses = [];
    let page = 1;
    while (verses.length < chapter.versesCount) {
      // chapter.id is always 1-114 at runtime, but the SDK types it as a
      // literal union it can't infer from a dynamic `number`.
      const batch = await client.verses.findByChapter(chapter.id as never, {
        page,
        perPage: 300,
      });
      if (batch.length === 0) break;
      verses.push(...batch);
      page += 1;
    }

    if (verses.length !== chapter.versesCount) {
      console.warn(
        `quran.service: expected ${chapter.versesCount} ayat for surah ${chapter.id}, got ${verses.length}`,
      );
    }

    for (const verse of verses) {
      AYAH_MAP[`${chapter.id}:${verse.verseNumber}`] = {
        surah: chapter.id,
        ayah: verse.verseNumber,
        page: verse.pageNumber,
      };
    }
  }

  buildPageMap();

  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(
    CACHE_PATH,
    JSON.stringify({ ayahMap: AYAH_MAP, surahMap: SURAH_MAP, pageMap: PAGE_MAP }),
  );
};

export const initQuranMaps = async () => {
  if (initialized) return;

  if (fs.existsSync(CACHE_PATH)) {
    const cache: QuranMapsCache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
    populateFrom(cache);
  } else {
    await fetchFresh();
  }

  initialized = true;
  console.log(
    `Quran maps ready: ${Object.keys(SURAH_MAP).length} surahs, ${Object.keys(AYAH_MAP).length} ayat, ${Object.keys(PAGE_MAP).length} pages.`,
  );
};
