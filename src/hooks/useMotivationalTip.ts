import { useMemo, useCallback, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";

const DAY_MS = 24 * 60 * 60 * 1000;
const LESSONS_COOLDOWN_MS = 3 * DAY_MS;
const PROBLEMS_COOLDOWN_MS = 2 * DAY_MS;
const LESSON_THRESHOLD = 70;
const PROBLEMS_MIN = 20;

const lessonsKey = (uid: string) => `pyro-tip-lessons-lastshown:${uid}`;
const problemsKey = (uid: string) => `pyro-tip-problems-lastshown:${uid}`;

export type TipType = "lessons" | "problems" | null;

export function useMotivationalTip() {
  const { user } = useAuth();
  const { progress } = useProgress();
  const [dismissed, setDismissed] = useState(false);

  // Reset when user changes
  useEffect(() => {
    setDismissed(false);
  }, [user?.id]);

  const type: TipType = useMemo(() => {
    if (!user || dismissed) return null;

    // Only show after finishing a lesson in this session, not on app open
    let hasTrigger = false;
    try { hasTrigger = sessionStorage.getItem("pyro-tip-trigger") === "1"; } catch {}
    if (!hasTrigger) return null;

    const entries = Object.entries(progress.completedLessons || {});
    if (entries.length === 0) return null;

    const now = Date.now();

    // Tip #1: low-score lessons (exclude problem-* keys)
    const hasWeakLesson = entries.some(
      ([id, data]) =>
        !id.startsWith("problem-") &&
        data?.completed &&
        typeof data.score === "number" &&
        data.score < LESSON_THRESHOLD
    );
    if (hasWeakLesson) {
      const last = Number(localStorage.getItem(lessonsKey(user.id)) || "0");
      if (now - last >= LESSONS_COOLDOWN_MS) return "lessons";
    }

    // Tip #2: few solved problems
    const solvedProblems = entries.filter(
      ([id, data]) => id.startsWith("problem-") && data?.completed
    ).length;
    if (solvedProblems < PROBLEMS_MIN) {
      const last = Number(localStorage.getItem(problemsKey(user.id)) || "0");
      if (now - last >= PROBLEMS_COOLDOWN_MS) return "problems";
    }

    return null;
  }, [user, progress.completedLessons, dismissed]);

  const markShown = useCallback(
    (t: Exclude<TipType, null>) => {
      if (!user) return;
      const key = t === "lessons" ? lessonsKey(user.id) : problemsKey(user.id);
      localStorage.setItem(key, String(Date.now()));
      try { sessionStorage.removeItem("pyro-tip-trigger"); } catch {}
    },
    [user]
  );

  const dismiss = useCallback(() => setDismissed(true), []);

  return { type, markShown, dismiss };
}
