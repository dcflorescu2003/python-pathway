import { useChapters, Chapter } from "@/hooks/useChapters";
import { useProblems, Problem } from "@/hooks/useProblems";

const MAX_LEVEL = 25;
const PROBLEM_WEIGHT = 0.2;
const FALLBACK_XP_PER_LEVEL = 100;

export interface XPThresholds {
  totalMaxXP: number;
  xpPerLevel: number;
}

export function computeXPThresholds(
  chapters: Chapter[] | undefined,
  problems: Problem[] | undefined
): XPThresholds {
  if (!chapters?.length) {
    return { totalMaxXP: MAX_LEVEL * FALLBACK_XP_PER_LEVEL, xpPerLevel: FALLBACK_XP_PER_LEVEL };
  }

  const lessonsXP = chapters.reduce(
    (sum, ch) => sum + ch.lessons.reduce((s, l) => s + l.xpReward, 0),
    0
  );

  const problemsXP = (problems ?? []).reduce((sum, p) => sum + p.xpReward, 0);

  const totalMaxXP = lessonsXP + PROBLEM_WEIGHT * problemsXP;
  const xpPerLevel = Math.max(FALLBACK_XP_PER_LEVEL, totalMaxXP / MAX_LEVEL);

  return { totalMaxXP, xpPerLevel };
}

export function getLevelFromXP(xp: number, xpPerLevel: number = FALLBACK_XP_PER_LEVEL): number {
  return Math.min(MAX_LEVEL, Math.floor(xp / xpPerLevel) + 1);
}

export function getXPForNextLevel(xp: number, xpPerLevel: number = FALLBACK_XP_PER_LEVEL): number {
  return Math.ceil(xpPerLevel - (xp % xpPerLevel));
}

export function useXPThresholds(): XPThresholds {
  const { data: chapters } = useChapters();
  const { data: problemsData } = useProblems();

  return computeXPThresholds(chapters, problemsData?.problems);
}
