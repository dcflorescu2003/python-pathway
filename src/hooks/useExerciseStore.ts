import { chapters as defaultChapters, Chapter } from "@/data/courses";

const STORAGE_KEY = "custom_chapters_v2";

const loadChapters = (): Chapter[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultChapters;
};

// Singleton for reading chapters across the app
export const getStoredChapters = (): Chapter[] => loadChapters();
