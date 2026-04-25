import type { Chapter } from "@/hooks/useChapters";

/**
 * Resolves a `lesson_id` (as stored in `completed_lessons`) to a human-readable
 * title. Handles three sources:
 *   1. Standard chapter lessons from `useChapters()`.
 *   2. Auto-generated "Fixare: …" lessons (suffix `f` on a real lesson id).
 *   3. Manual/public lessons (ids like `ch1-l1776...`) loaded separately.
 *
 * Falls back to a friendly placeholder instead of returning the raw id.
 */
export function resolveLessonTitle(
  lessonId: string,
  chapters: Chapter[] | undefined,
  manualTitles: Record<string, string> = {}
): string {
  if (!lessonId) return "Lecție necunoscută";

  // Manual/public lessons
  if (manualTitles[lessonId]) return manualTitles[lessonId];

  const chs = chapters ?? [];

  // Direct match
  for (const ch of chs) {
    const lesson = ch.lessons.find((l) => l.id === lessonId);
    if (lesson) return lesson.title;
  }

  // "Fixare" auto-generated lessons (suffix `f`)
  if (lessonId.endsWith("f")) {
    const baseId = lessonId.slice(0, -1);
    for (const ch of chs) {
      const lesson = ch.lessons.find((l) => l.id === baseId);
      if (lesson) return `Fixare: ${lesson.title}`;
    }
  }

  // Try to derive chapter from id pattern (e.g. `c3-l5` → chapter 3)
  const m = lessonId.match(/^c(?:h)?(\d+)-/i);
  if (m) {
    const chNum = Number(m[1]);
    const ch = chs.find((c) => c.number === chNum);
    if (ch) return `${ch.title} · lecție arhivată`;
  }

  return "Lecție arhivată";
}
