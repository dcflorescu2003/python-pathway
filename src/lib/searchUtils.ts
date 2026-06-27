import type { School } from "@/data/schools";

/**
 * Normalize a string for diacritic-insensitive search.
 * Removes Romanian diacritics (ă, â, î, ș, ț + cedilla variants) and lowercases.
 */
export function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics
    .replace(/ș/g, "s")
    .replace(/ş/g, "s")
    .replace(/ț/g, "t")
    .replace(/ţ/g, "t");
}

/**
 * Check if `haystack` contains `needle` ignoring diacritics and case.
 */
export function matchesSearch(haystack: string, needle: string): boolean {
  if (!needle.trim()) return true;
  return normalizeForSearch(haystack).includes(normalizeForSearch(needle));
}

/**
 * Check if a school is from Bucharest (any sector).
 */
export function isBucharestSchool(school: { city: string }): boolean {
  return /bucure/i.test(school.city);
}

/**
 * Rank a school match against a search query.
 * Higher score = better match.
 */
function rankSchool(school: School, query: string): number {
  const q = normalizeForSearch(query);
  const name = normalizeForSearch(school.name);
  const city = normalizeForSearch(school.city);

  let score = 0;

  // Bucharest schools always get a big boost.
  if (isBucharestSchool(school)) score += 10000;

  if (q) {
    if (name === q) score += 1000;
    else if (name.startsWith(q)) score += 500;
    else if (new RegExp(`\\b${escapeRegex(q)}\\b`).test(name)) score += 300;
    else if (name.includes(q)) score += 100;

    if (city === q) score += 80;
    else if (city.startsWith(q)) score += 40;
    else if (city.includes(q)) score += 20;
  }

  return score;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Filter schools by query and sort them with:
 * 1. Bucharest schools first.
 * 2. Exact and strong name matches before substring matches.
 * 3. Name matches before city matches.
 */
export function filterAndSortSchools(
  schools: School[],
  query: string,
  limit?: number
): School[] {
  const q = query.trim();
  const filtered = q
    ? schools.filter((s) => matchesSearch(`${s.name} ${s.city}`, q))
    : schools.slice();

  const ranked = filtered
    .map((school) => ({ school, score: rankSchool(school, q) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Stable tie-breaker: alphabetical by normalized name so the canonical
      // "Colegiul Național Spiru Haret" ranks before "UCECOM"/"Universitar" variants.
      return normalizeForSearch(a.school.name).localeCompare(normalizeForSearch(b.school.name));
    })
    .map((entry) => entry.school);


  return limit ? ranked.slice(0, limit) : ranked;
}

