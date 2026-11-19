/**
 * World universities search, used by the pre-screen "School name" picker.
 * Data: data/universities.json — [name, country] pairs built from the
 * Hipo "university-domains-list" (MIT licence).
 */
import universities from "@/data/universities.json";

export interface SchoolMatch {
  name: string;
  country: string;
}

const LIST = universities as [string, string][];
const INDEX = LIST.map(([name, country]) => ({ name, country, key: normalize(name) }));

function normalize(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Best matches for `query`: names starting with it first, then names with a
 * word starting with it, then names containing every typed word.
 */
export function searchSchools(query: string, limit = 12): SchoolMatch[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const words = q.split(" ");
  const ranked: { m: SchoolMatch; rank: number }[] = [];
  for (const s of INDEX) {
    if (!words.every((w) => s.key.includes(w))) continue;
    const rank = s.key.startsWith(q) ? 0 : ` ${s.key}`.includes(` ${q}`) ? 1 : 2;
    ranked.push({ m: { name: s.name, country: s.country }, rank });
  }
  ranked.sort((a, b) => a.rank - b.rank || a.m.name.length - b.m.name.length);
  return ranked.slice(0, limit).map((r) => r.m);
}
