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
