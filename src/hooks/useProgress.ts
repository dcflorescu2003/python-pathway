import { useState, useCallback } from "react";

export interface UserProgress {
  xp: number;
  streak: number;
  lives: number;
  completedLessons: Record<string, { score: number; completed: boolean }>;
  lastActivityDate: string;
}

const DEFAULT_PROGRESS: UserProgress = {
  xp: 0,
  streak: 0,
  lives: 3,
  completedLessons: {},
  lastActivityDate: new Date().toISOString().split("T")[0],
};

const STORAGE_KEY = "pylearn-progress";

function loadProgress(): UserProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { ...DEFAULT_PROGRESS };
}

function saveProgress(p: UserProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress>(loadProgress);

  const completeLesson = useCallback((lessonId: string, xpEarned: number, score: number) => {
    setProgress((prev) => {
      const today = new Date().toISOString().split("T")[0];
      const wasYesterday = (() => {
        const d = new Date(prev.lastActivityDate);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split("T")[0] === today;
      })();

      const newProgress: UserProgress = {
        ...prev,
        xp: prev.xp + xpEarned,
        streak: prev.lastActivityDate === today ? prev.streak : wasYesterday ? prev.streak + 1 : 1,
        lastActivityDate: today,
        completedLessons: {
          ...prev.completedLessons,
          [lessonId]: { score, completed: true },
        },
      };
      saveProgress(newProgress);
      return newProgress;
    });
  }, []);

  const loseLife = useCallback(() => {
    setProgress((prev) => {
      const newProgress = { ...prev, lives: Math.max(0, prev.lives - 1) };
      saveProgress(newProgress);
      return newProgress;
    });
  }, []);

  const resetLives = useCallback(() => {
    setProgress((prev) => {
      const newProgress = { ...prev, lives: 3 };
      saveProgress(newProgress);
      return newProgress;
    });
  }, []);

  return { progress, completeLesson, loseLife, resetLives };
}
