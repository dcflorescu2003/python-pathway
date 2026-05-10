// Helpers for generating memorable problem IDs based on chapter prefixes.
// rec=cap1 (recapitulare), pr=cap2 (programe), lst=cap3 (liste),
// gs=cap4, sub=cap5 (subprograme), fis=cap6 (fișiere)

export const CHAPTER_PREFIX: Record<string, string> = {
  cap1: "rec",
  cap2: "pr",
  cap3: "lst",
  cap4: "gs",
  cap5: "sub",
  cap6: "fis",
};

export const getChapterPrefix = (chapterId: string) =>
  CHAPTER_PREFIX[chapterId] || (chapterId ? chapterId.slice(0, 3).toLowerCase() : "p");

/**
 * Generates the next available memorable problem ID for a chapter.
 * Looks at all existing IDs that match the chapter's prefix and returns
 * `<prefix><N+1>` where N is the highest number found.
 */
export const generateProblemId = (chapterId: string, existingIds: string[] = []) => {
  const prefix = getChapterPrefix(chapterId);
  const re = new RegExp(`^${prefix}(\\d+)$`);
  let max = 0;
  for (const id of existingIds) {
    const m = id.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}${max + 1}`;
};

/**
 * Generates N consecutive IDs without colliding with existing ones.
 */
export const generateProblemIds = (chapterId: string, existingIds: string[], count: number): string[] => {
  const prefix = getChapterPrefix(chapterId);
  const re = new RegExp(`^${prefix}(\\d+)$`);
  let max = 0;
  for (const id of existingIds) {
    const m = id.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  const out: string[] = [];
  for (let i = 1; i <= count; i++) out.push(`${prefix}${max + i}`);
  return out;
};
