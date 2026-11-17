# Quran metadata maps

Three static, in-memory lookup structures covering the whole Quran, built once
from the Quran Foundation API (`@quranjs/api/server`) and cached to disk so
the server doesn't refetch on every boot.

All page numbers follow the **QDC mushafId 2** layout (Hafs, Uthmani script,
15-line Madani mushaf, 604 pages) — the only mushaf this app supports.

## Source

[src/services/quran.service.ts](../src/services/quran.service.ts)

- `initQuranMaps()` — called once at startup (wired into [app.ts](../app.ts)
  before `app.listen`). Loads from the cache file if present, otherwise
  fetches from the API and writes the cache.
- Exports three populated `Record` maps plus their TS interfaces:
  `AYAH_MAP`, `SURAH_MAP`, `PAGE_MAP`.

## Cache file

`src/data/quranMaps.mushaf2.cache.json` — committed to the repo. Delete it
and restart with valid `QURAN_FOUNDATION_CLIENT_ID`/`SECRET` env vars to
regenerate.

```ts
{
  ayahMap: Record<string, AyahMeta>,        // key: "surah:ayah", e.g. "2:255"
  surahMap: Record<number, SurahMeta>,      // key: surah number 1-114
  pageMap: Record<number, PageSurahRange[]> // key: page number 1-604
}

interface AyahMeta {
  surah: number;
  ayah: number;   // 1-based, within the surah
  page: number;   // 1-604
}

interface SurahMeta {
  surah: number;
  startPage: number;
  endPage: number;
  ayahCount: number;
  type: "meccan" | "medinan";
}

interface PageSurahRange {
  surah: number;
  start: number;  // first ayah of this surah on the page
  end: number;    // last ayah of this surah on the page
}
```

## Verified examples

- 114 surahs, 6,236 ayat, 604 pages.
- `pageMap[1]` → `[{"surah":1,"start":1,"end":7}]`
- `pageMap[604]` → surahs 112–114 (`[{surah:112,...}, {surah:113,...}, {surah:114,...}]`)
- `ayahMap["2:255"]` → page 42 (Ayat al-Kursi)
- `surahMap[1]` → `startPage: 1`

## Scope

No ayah text, no surah display names, no API routes — deliberately scoped as
internal data only. Any consumer can read
`src/data/quranMaps.mushaf2.cache.json` directly as plain JSON in the shape
above, without depending on `quran.service.ts`.
