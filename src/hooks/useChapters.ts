import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

// Generate "Fixare" exercises from original exercises
function transformExercise(ex: Exercise, index: number): Exercise {
  const fid = ex.id + "f";

  if (ex.type === "quiz" && ex.options && ex.options.length > 0) {
    const shuffled = [...ex.options].sort(() => Math.random() - 0.5);
    return {
      id: fid, type: "quiz", xp: ex.xp,
      question: ex.question,
      options: shuffled.map((o, i) => ({ id: String.fromCharCode(97 + i), text: o.text })),
      correctOptionId: String.fromCharCode(97 + shuffled.findIndex(o => o.id === ex.correctOptionId)),
      explanation: ex.explanation,
    };
  }

  if (ex.type === "truefalse") {
    return {
      id: fid, type: "truefalse", xp: ex.xp,
      question: ex.question,
      statement: ex.statement,
      isTrue: !ex.isTrue,
      explanation: ex.explanation ? (ex.isTrue ? "Afirmația originală era adevărată, dar acum a fost inversată." : "Afirmația originală era falsă, dar acum a fost inversată.") : undefined,
    };
  }

  if (ex.type === "fill" && ex.blanks && ex.blanks.length > 0) {
    return {
      id: fid, type: "quiz", xp: ex.xp,
      question: `Care este valoarea corectă pentru blank-ul din: ${ex.question}`,
      options: [
        { id: "a", text: ex.blanks[0].answer },
        { id: "b", text: ex.blanks[0].answer + "s" },
        { id: "c", text: "None" },
        { id: "d", text: "print" },
      ].sort(() => Math.random() - 0.5).map((o, i) => ({ id: String.fromCharCode(97 + i), text: o.text })),
      correctOptionId: "a",
      explanation: ex.explanation,
    };
  }

  if (ex.type === "order" && ex.lines && ex.lines.length > 0) {
    const sorted = [...ex.lines].sort((a, b) => a.order - b.order);
    const targetIdx = index % sorted.length;
    const targetLine = sorted[targetIdx];
    const words = targetLine.text.split(/([a-zA-Z_]+)/).filter(w => /^[a-zA-Z_]+$/.test(w));
    const blankWord = words.length > 0 ? words.reduce((a, b) => a.length >= b.length ? a : b) : targetLine.text;
    const template = sorted.map((l, i) =>
      i === targetIdx ? l.text.replace(blankWord, "___") : l.text
    ).join("\n");
    return {
      id: fid, type: "fill", xp: ex.xp,
      question: "Completează cuvântul lipsă din cod:",
      codeTemplate: template,
      blanks: [{ id: "b1", answer: blankWord }],
      explanation: ex.explanation,
    };
  }

  if (ex.type === "match" && ex.pairs && ex.pairs.length > 0) {
    const target = ex.pairs[index % ex.pairs.length];
    const shuffledOpts = [...ex.pairs].sort(() => Math.random() - 0.5);
    return {
      id: fid, type: "quiz", xp: ex.xp,
      question: `Ce se asociază cu „${target.left}"?`,
      options: shuffledOpts.map((p, i) => ({ id: String.fromCharCode(97 + i), text: p.right })),
      correctOptionId: String.fromCharCode(97 + shuffledOpts.findIndex(p => p.id === target.id)),
      explanation: ex.explanation,
    };
  }

  return {
    id: fid, type: "truefalse", xp: ex.xp,
    question: "Adevărat sau Fals?",
    statement: ex.question,
    isTrue: true,
    explanation: ex.explanation,
  };
}

// Add "Fixare" lessons after each non-practice, non-test lesson
function addFixareLessons(chapters: Chapter[]): Chapter[] {
  return chapters.map(ch => {
    const newLessons: Lesson[] = [];
    const nonPracticeLessons = ch.lessons.filter(l =>
      !l.title.startsWith("Practică:") && !l.title.startsWith("Test")
    );
    const practiceLessons = ch.lessons.filter(l =>
      l.title.startsWith("Practică:") || l.title.startsWith("Test")
    );

    nonPracticeLessons.forEach(lesson => {
      newLessons.push(lesson);
      const fixareLesson: Lesson = {
        id: lesson.id + "f",
        title: "Fixare: " + lesson.title,
        description: "Exerciții de fixare – " + lesson.description.charAt(0).toLowerCase() + lesson.description.slice(1),
        xpReward: lesson.xpReward,
        exercises: lesson.exercises.map((ex, i) => transformExercise(ex, i)),
      };
      newLessons.push(fixareLesson);
    });

    newLessons.push(...practiceLessons);
    return { ...ch, lessons: newLessons };
  });
}

async function fetchChapters(): Promise<Chapter[]> {
  const { data: chaptersData, error: chaptersError } = await supabase
    .from("chapters")
    .select("*")
    .order("number");

  if (chaptersError) throw chaptersError;

  const { data: lessonsData, error: lessonsError } = await supabase
    .from("lessons")
    .select("*")
    .order("sort_order");

  if (lessonsError) throw lessonsError;

  const { data: exercisesData, error: exercisesError } = await supabase
    .from("exercises")
    .select("*")
    .order("sort_order");

  if (exercisesError) throw exercisesError;

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

  return addFixareLessons(rawChapters);
}

export function useChapters() {
  return useQuery({
    queryKey: ["chapters"],
    queryFn: fetchChapters,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000,
  });
}

export const getLevelFromXP = (xp: number): number => Math.floor(xp / 100) + 1;
export const getXPForNextLevel = (xp: number): number => 100 - (xp % 100);
