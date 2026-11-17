/**
 * Competency level = accuracy + coverage. A high score on a handful of items
 * is not enough: "Avansat" also needs most related lessons finished and some
 * related practice problems solved.
 */
export interface CompetencyCoverage {
  lessonsTotal: number;
  lessonsDone: number;
  problemsTotal: number;
  problemsDone: number;
}

export type CompetencyLevel = "Neevaluat" | "În curs de dobândire" | "De bază" | "Consolidat" | "Avansat";

const ratio = (done: number, total: number) => (total > 0 ? done / total : 1);

export function competencyLevel(accuracy: number | null, cov?: CompetencyCoverage | null): CompetencyLevel {
  if (accuracy === null) return "Neevaluat";
  const l = cov ? ratio(cov.lessonsDone, cov.lessonsTotal) : 1;
  const p = cov ? ratio(cov.problemsDone, cov.problemsTotal) : 1;
  if (accuracy >= 0.85 && l >= 0.9 && p >= 0.3) return "Avansat";
  if (accuracy >= 0.7 && l >= 0.5) return "Consolidat";
  if (accuracy >= 0.5 && l >= 0.25) return "De bază";
  return "În curs de dobândire";
}

/** Plain-language meaning of each general competency, for parents. */
export const PARENT_SKILL_BY_GENERAL: Record<string, string> = {
  CG1: "Recunoaște noțiunile de bază (variabile, instrucțiuni, algoritmi)",
  CG2: "Explică cum funcționează un algoritm sau un program",
  CG3: "Scrie singur(ă) programe și algoritmi",
  CG4: "Analizează și compară soluții",
  CG5: "Verifică dacă un program e corect și eficient",
};

export const parentSkill = (generalCode: string, fallback: string) =>
  PARENT_SKILL_BY_GENERAL[generalCode.replace(/\s+/g, "")] ?? fallback;
