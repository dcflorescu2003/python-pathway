import type { StudentReportData } from "@/lib/studentReportData";

export interface Insight {
  tone: "good" | "warn" | "bad";
  text: string;
}

export const masteryLevelLabel = (m: number | null): string => {
  if (m === null) return "Neevaluat";
  if (m >= 0.85) return "Avansat";
  if (m >= 0.6) return "Consolidat";
  if (m >= 0.4) return "De bază";
  return "Insuficient";
};

/**
 * Rule-based recommendations: no AI, no extra requests. Highlights weak
 * competencies, low-scoring lessons, repeatedly missed test items and gaps
 * in coverage (unfinished lessons, no problems solved).
 */
export function buildStudentInsights(d: StudentReportData): Insight[] {
  const out: Insight[] = [];

  // 1. Weak competencies (evaluated but under "consolidated")
  const weakComps = d.competencies
    .filter((c) => c.mastery !== null && c.mastery < 0.6 && Number(c.max_sum) > 0)
    .sort((a, b) => (a.mastery ?? 0) - (b.mastery ?? 0))
    .slice(0, 3);
  weakComps.forEach((c) => {
    out.push({
      tone: (c.mastery ?? 0) < 0.4 ? "bad" : "warn",
      text: `Competența ${c.specific_code} (${c.specific_title}) este la nivel ${masteryLevelLabel(
        c.mastery
      )} — ${Math.round((c.mastery ?? 0) * 100)}%. Recomandă exerciții suplimentare pe această temă.`,
    });
  });

  // 2. Lessons below 80%
  if (d.weakLessons.length > 0) {
    const list = d.weakLessons.slice(0, 3).map((l) => `${l.title} (${l.score}%)`).join(", ");
    out.push({
      tone: d.weakLessons.some((l) => l.score < 50) ? "bad" : "warn",
      text: `Reluare recomandată la ${d.weakLessons.length} lecții cu scor sub 80%: ${list}.`,
    });
  }

  // 3. Repeatedly missed test items
  const missCount = new Map<string, number>();
  d.tests.forEach((t) =>
    t.wrongItems.forEach((it) => {
      missCount.set(it.question, (missCount.get(it.question) ?? 0) + 1);
    })
  );
  const repeated = [...missCount.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);
  if (repeated.length > 0) {
    out.push({
      tone: "bad",
      text: `Greșește repetat la: ${repeated.slice(0, 2).map(([q, n]) => `„${q}” (${n}×)`).join("; ")}.`,
    });
  } else if (d.tests.length > 0) {
    const worst = d.tests
      .flatMap((t) => t.wrongItems.map((it) => ({ ...it, test: t.testTitle })))
      .slice(0, 2);
    if (worst.length > 0) {
      out.push({
        tone: "warn",
        text: `Itemi de reluat din teste: ${worst.map((w) => `„${w.question}” (${w.score}/${w.maxPoints}p)`).join("; ")}.`,
      });
    }
  }

  // 4. Coverage gaps
  if (d.missingLessons.length > 0) {
    const byChapter = new Map<string, number>();
    d.missingLessons.forEach((l) => byChapter.set(l.chapterTitle, (byChapter.get(l.chapterTitle) ?? 0) + 1));
    const top = [...byChapter.entries()].sort((a, b) => b[1] - a[1])[0];
    out.push({
      tone: "warn",
      text: `Are ${d.missingLessons.length} lecții neparcurse, cele mai multe la „${top[0]}” (${top[1]}). Următoarea recomandare: ${d.missingLessons[0].title}.`,
    });
  }

  if (d.problemsSolved === 0) {
    out.push({
      tone: "warn",
      text: "Nu a rezolvat încă nicio problemă de programare — recomandă câteva probleme ușoare pentru consolidare practică.",
    });
  }

  // 5. Positives
  if ((d.avgLessonScore ?? 0) >= 90 && d.lessons.length >= 5) {
    out.push({ tone: "good", text: `Scor mediu excelent la lecții (${d.avgLessonScore}%). Poate primi sarcini de dificultate mai mare.` });
  }
  if (d.streak >= 7) {
    out.push({ tone: "good", text: `Consecvență foarte bună: ${d.streak} zile consecutive de activitate.` });
  }
  if (out.length === 0) {
    out.push({ tone: "good", text: "Nu au fost identificate probleme — activitatea elevului este echilibrată." });
  }

  return out.slice(0, 6);
}
