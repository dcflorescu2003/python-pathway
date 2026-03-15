import { useState, useCallback, useEffect } from "react";
import { chapters as defaultChapters, Chapter, Lesson, Exercise } from "@/data/courses";

const STORAGE_KEY = "custom_chapters_v2";

const loadChapters = (): Chapter[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultChapters;
};

const saveChapters = (chapters: Chapter[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chapters));
};

export const useExerciseStore = () => {
  const [chapters, setChapters] = useState<Chapter[]>(loadChapters);

  useEffect(() => {
    saveChapters(chapters);
  }, [chapters]);

  const resetToDefaults = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setChapters(defaultChapters);
  }, []);

  const updateExercise = useCallback((lessonId: string, exercise: Exercise) => {
    setChapters(prev => prev.map(ch => ({
      ...ch,
      lessons: ch.lessons.map(l =>
        l.id === lessonId
          ? { ...l, exercises: l.exercises.map(e => e.id === exercise.id ? exercise : e) }
          : l
      ),
    })));
  }, []);

  const addExercise = useCallback((lessonId: string, exercise: Exercise) => {
    setChapters(prev => prev.map(ch => ({
      ...ch,
      lessons: ch.lessons.map(l =>
        l.id === lessonId
          ? { ...l, exercises: [...l.exercises, exercise] }
          : l
      ),
    })));
  }, []);

  const deleteExercise = useCallback((lessonId: string, exerciseId: string) => {
    setChapters(prev => prev.map(ch => ({
      ...ch,
      lessons: ch.lessons.map(l =>
        l.id === lessonId
          ? { ...l, exercises: l.exercises.filter(e => e.id !== exerciseId) }
          : l
      ),
    })));
  }, []);

  const updateLesson = useCallback((lessonId: string, data: Partial<Lesson>) => {
    setChapters(prev => prev.map(ch => ({
      ...ch,
      lessons: ch.lessons.map(l =>
        l.id === lessonId ? { ...l, ...data } : l
      ),
    })));
  }, []);

  const addLesson = useCallback((chapterId: string, lesson: Lesson) => {
    setChapters(prev => prev.map(ch =>
      ch.id === chapterId ? { ...ch, lessons: [...ch.lessons, lesson] } : ch
    ));
  }, []);

  const deleteLesson = useCallback((chapterId: string, lessonId: string) => {
    setChapters(prev => prev.map(ch =>
      ch.id === chapterId
        ? { ...ch, lessons: ch.lessons.filter(l => l.id !== lessonId) }
        : ch
    ));
  }, []);

  return {
    chapters,
    updateExercise,
    addExercise,
    deleteExercise,
    updateLesson,
    addLesson,
    deleteLesson,
    resetToDefaults,
  };
};

// Singleton for reading chapters across the app
export const getStoredChapters = (): Chapter[] => loadChapters();
