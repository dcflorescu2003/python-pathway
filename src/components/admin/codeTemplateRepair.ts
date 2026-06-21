// Shared helpers for detecting & repairing exercises that look like they're
// missing their `code_template` (the code snippet shown under the question).
//
// Pattern: short quiz/truefalse questions like "Ce se afișează?" or
// "Ce returnează funcția?" — these almost always come with a code block.
// If `code_template` is null AND no code fence (```) appears in the question,
// we flag the exercise as suspicious.

export interface MinimalExercise {
  type: string;
  question?: string | null;
  codeTemplate?: string | null;
  code_template?: string | null;
}

const SUSPICIOUS_RE = /afi[șs]ea|returneaz[ăa]|output|ce se va|ce tip[ăa]re[șs]te/i;

export function questionLooksLikeItNeedsCode(question: string | null | undefined): boolean {
  if (!question) return false;
  const q = question.trim();
  if (q.length === 0 || q.length > 120) return false;
  // If the question already contains a fenced code block, there's code inline.
  if (q.includes("```")) return false;
  return SUSPICIOUS_RE.test(q);
}

export function exerciseNeedsCodeRepair(ex: MinimalExercise): boolean {
  const type = (ex.type || "").toLowerCase();
  if (type !== "quiz" && type !== "truefalse") return false;
  const code = ex.codeTemplate ?? ex.code_template;
  if (code && code.trim().length > 0) return false;
  return questionLooksLikeItNeedsCode(ex.question);
}

export function countLessonRepairNeeded(exercises: MinimalExercise[] | undefined | null): number {
  if (!exercises) return 0;
  let n = 0;
  for (const ex of exercises) if (exerciseNeedsCodeRepair(ex)) n++;
  return n;
}

/** Normalize question text for fuzzy matching between CSV and DB. */
export function normalizeQuestion(q: string | null | undefined): string {
  return (q || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[`*_~]/g, "")
    .trim()
    .slice(0, 120);
}
