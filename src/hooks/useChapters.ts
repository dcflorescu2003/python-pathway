import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { chapters as localChapters } from "@/data/courses";
import { Capacitor } from "@capacitor/core";

export type ExerciseType = "quiz" | "fill" | "order" | "truefalse" | "match";

export interface ExerciseOption {
  id: string;
  text: string;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  options?: ExerciseOption[];
  correctOptionId?: string;
  codeTemplate?: string;
  blanks?: { id: string; answer: string }[];
  lines?: { id: string; text: string; order: number }[];
  statement?: string;
  isTrue?: boolean;
  explanation?: string;
  pairs?: { id: string; left: string; right: string }[];
  xp: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  exercises: Exercise[];
  xpReward: number;
  isPremium?: boolean;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  lessons: Lesson[];
}

function getNativeFallbackChapters() {
  return localChapters as Chapter[];
}

function handleNativeFallback<T>(isNativePlatform: boolean, error: T, message: string): Chapter[] {
  if (!isNativePlatform) {
    throw error;
  }

  console.error(message, error);
  return getNativeFallbackChapters();
}

// Transform exercise from DB row to typed Exercise
function mapExercise(row: any): Exercise {
  return {
    id: row.id,
    type: row.type as ExerciseType,
    question: row.question,
    options: row.options ?? undefined,
    correctOptionId: row.correct_option_id ?? undefined,
    codeTemplate: row.code_template ?? undefined,
    blanks: row.blanks ?? undefined,
    lines: row.lines ?? undefined,
    statement: row.statement ?? undefined,
    isTrue: row.is_true ?? undefined,
    explanation: row.explanation ?? undefined,
    pairs: row.pairs ?? undefined,
    xp: row.xp,
  };
}


async function fetchChapters(): Promise<Chapter[]> {
  const isNativePlatform = Capacitor.isNativePlatform();
  const { data: chaptersData, error: chaptersError } = await supabase
    .from("chapters")
    .select("*")
    .order("number");

  if (chaptersError) {
    return handleNativeFallback(
      isNativePlatform,
      chaptersError,
      "Failed to load chapters from Supabase, using local fallback:"
    );
  }

  const { data: lessonsData, error: lessonsError } = await supabase
    .from("lessons")
    .select("*")
    .order("sort_order");

  if (lessonsError) {
    return handleNativeFallback(
      isNativePlatform,
      lessonsError,
      "Failed to load lessons from Supabase, using local fallback:"
    );
  }

  const { data: exercisesData, error: exercisesError } = await supabase
    .from("exercises")
    .select("*")
    .order("sort_order");

  if (exercisesError) {
    return handleNativeFallback(
      isNativePlatform,
      exercisesError,
      "Failed to load exercises from Supabase, using local fallback:"
    );
  }

  if (!chaptersData?.length || !lessonsData?.length) {
    if (!isNativePlatform) {
      throw new Error("Supabase returned empty chapter data on web.");
    }
    console.warn("Supabase returned empty chapter data, using local fallback.");
    return getNativeFallbackChapters();
  }

  // Group exercises by lesson
  const exercisesByLesson: Record<string, Exercise[]> = {};
  for (const ex of exercisesData) {
    if (!exercisesByLesson[ex.lesson_id]) exercisesByLesson[ex.lesson_id] = [];
    exercisesByLesson[ex.lesson_id].push(mapExercise(ex));
  }

  // Group lessons by chapter
  const lessonsByChapter: Record<string, Lesson[]> = {};
  for (const l of lessonsData) {
    if (!lessonsByChapter[l.chapter_id]) lessonsByChapter[l.chapter_id] = [];
    lessonsByChapter[l.chapter_id].push({
      id: l.id,
      title: l.title,
      description: l.description,
      xpReward: l.xp_reward,
      isPremium: l.is_premium,
      exercises: exercisesByLesson[l.id] || [],
    });
  }

  const rawChapters: Chapter[] = chaptersData.map(ch => ({
    id: ch.id,
    number: ch.number,
    title: ch.title,
    description: ch.description,
    icon: ch.icon,
    color: ch.color,
    lessons: lessonsByChapter[ch.id] || [],
  }));

  if (rawChapters.length > 0) return rawChapters;
  if (!isNativePlatform) {
    throw new Error("Hydrated chapters are empty on web.");
  }
  return getNativeFallbackChapters();
}

export function useChapters() {
  return useQuery({
    queryKey: ["chapters"],
    queryFn: fetchChapters,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000,
  });
}

// XP functions moved to src/hooks/useXPThresholds.ts — import from there directly
