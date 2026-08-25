import { esc } from "@/lib/studentReportHtml";
import { masteryLevelLabel } from "@/lib/studentInsights";
import type {
  ClassKpis, StudentRow, WeakLesson, TestStat, ChapterProgress, ItemDifficulty, ClassCompetency,
} from "@/lib/classAnalytics";

export interface ClassReportPayload {
  className: string;
  kpis: ClassKpis;
  rows: StudentRow[];
  weakLessons: WeakLesson[];
  testStats: TestStat[];
  chapterProgress: ChapterProgress[];
  itemDifficulty: ItemDifficulty[];
  competencies: ClassCompetency[];
}

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("ro-RO") : "-");

const badge = (pct: number | null) => {
  if (pct === null) return `<span class="badge">-</span>`;
  const cls = pct >= 80 ? "badge-good" : pct >= 50 ? "badge-mid" : "badge-bad";
  return `<span class="badge ${cls}">${pct}%</span>`;
};

const kpi = (value: string | number, label: string) =>
  `<div class="mini-kpi"><div class="value">${esc(value)}</div><div class="label">${esc(label)}</div></div>`;

/** Class-level report body (also used as the header of the full per-student report). */
export function buildClassReportHtml(p: ClassReportPayload): string {
  const date = new Date().toLocaleDateString("ro-RO");
  const k = p.kpis;

  const students = `<table>
    <thead><tr>
      <th>#</th><th>Elev</th><th>Lecții</th><th>Recap.</th><th>Probleme</th>
      <th>Medie lecții</th><th>Medie teste</th><th>Teste</th><th>Ultima activ.</th><th>Streak</th><th>XP</th><th>Risc</th>
    </tr></thead>
    <tbody>
      ${p.rows
        .map(
          (s, i) => `<tr>
        <td>${i + 1}</td>
        <td>${esc(s.name)}</td>
        <td>${s.lessons}</td>
        <td>${s.reviews}</td>
        <td>${s.problems}</td>
        <td>${badge(s.avgLessonScore)}</td>
        <td>${s.avgTestScore !== null ? `${s.avgTestScore}%` : "-"}</td>
        <td>${s.testsSubmitted}</td>
        <td>${esc(fmtDate(s.lastActivity))}</td>
        <td>${s.streak}</td>
        <td>${s.xp}</td>
        <td>${s.atRisk ? `<span class="badge badge-bad">${esc(s.riskReasons.join(", "))}</span>` : "-"}</td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table>`;

  const chapters = p.chapterProgress.length
    ? `<table>
      <thead><tr><th>Capitol</th><th>Lecții</th><th>Parcurs mediu</th><th>Medie scor</th><th>Elevi începuți</th><th>Elevi finalizat</th></tr></thead>
      <tbody>${p.chapterProgress
        .map(
          (c) => `<tr>
          <td>${esc(c.title)}</td>
          <td>${c.totalLessons}</td>
          <td>${badge(c.coverage)}</td>
          <td>${badge(c.avgScore)}</td>
          <td>${c.studentsStarted}</td>
          <td>${c.studentsCompleted}</td>
        </tr>`
        )
        .join("")}</tbody></table>`
    : `<p class="sub">Fără date de parcurgere.</p>`;

  const comps = p.competencies.length
    ? `<table>
      <thead><tr><th>Competență specifică</th><th>Competență generală</th><th>Nivel clasă</th><th>Mastery</th><th>Elevi evaluați</th></tr></thead>
      <tbody>${p.competencies
        .map(
          (c) => `<tr>
          <td>${esc(c.specificCode)} ${esc(c.specificTitle)}</td>
          <td>${esc(c.generalCode)} ${esc(c.generalTitle)}</td>
          <td>${esc(masteryLevelLabel(c.mastery))}</td>
          <td>${badge(Math.round(c.mastery * 100))}</td>
          <td>${c.evaluatedStudents}</td>
        </tr>`
        )
        .join("")}</tbody></table>`
    : `<p class="sub">Nu există încă date de competențe pentru această clasă.</p>`;

  const weak = p.weakLessons.length
    ? `<table>
      <thead><tr><th>Lecție</th><th>Medie</th><th>Elevi</th><th>Încercări</th></tr></thead>
      <tbody>${p.weakLessons
        .map(
          (l) => `<tr><td>${esc(l.name)}</td><td>${badge(l.avgScore)}</td><td>${l.students}</td><td>${l.attempts}</td></tr>`
        )
        .join("")}</tbody></table>`
    : `<p class="sub">Nicio lecție sub 80%. 🎉</p>`;

  const tests = p.testStats.length
    ? `<table>
      <thead><tr><th>Test</th><th>Medie</th><th>Mediană</th><th>Min</th><th>Max</th><th>Sub 50%</th><th>Predate</th><th>Lipsă</th></tr></thead>
      <tbody>${p.testStats
        .map(
          (t) => `<tr>
          <td>${esc(t.title)}</td>
          <td>${badge(t.avg)}</td>
          <td>${t.median}%</td>
          <td>${t.min}%</td>
          <td>${t.max}%</td>
          <td>${t.below50}</td>
          <td>${t.count}</td>
          <td>${t.missing}</td>
        </tr>`
        )
        .join("")}</tbody></table>`
    : `<p class="sub">Niciun test predat.</p>`;

  const items = p.itemDifficulty.length
    ? `<table>
      <thead><tr><th>Item</th><th>Punctaj mediu</th><th>0p</th><th>Parțial</th><th>Complet</th><th>Total</th></tr></thead>
      <tbody>${p.itemDifficulty
        .map(
          (e) => `<tr>
          <td>${esc(e.question)}</td>
          <td>${badge(e.avgPercent)}</td>
          <td>${e.zeroCount}</td>
          <td>${e.partialCount}</td>
          <td>${e.fullCount}</td>
          <td>${e.total}</td>
        </tr>`
        )
        .join("")}</tbody></table>`
    : `<p class="sub">Fără itemi problematici.</p>`;

  return `
  <div style="text-align:center;margin-bottom:14px">
    <h1 style="font-size:20px;color:#6d28d9">Raport clasă: ${esc(p.className)}</h1>
    <p style="color:#666;font-size:10px">Generat pe ${esc(date)} · PyRo</p>
  </div>
  <div class="mini-kpis">
    ${kpi(`${k.activeStudents}/${k.totalStudents}`, "Elevi activi")}
    ${kpi(k.classAvg !== null ? `${k.classAvg}%` : "-", "Medie clasă")}
    ${kpi(k.lessons, "Lecții finalizate")}
    ${kpi(k.problems, "Probleme")}
    ${kpi(k.submittedCount, "Teste predate")}
    ${kpi(k.atRisk, "Elevi cu risc")}
  </div>
  <div class="section"><h2>👥 Situația elevilor</h2>${students}</div>
  <div class="section"><h2>📚 Progres pe capitole</h2>${chapters}</div>
  <div class="section"><h2>🎯 Competențe la nivel de clasă</h2>${comps}</div>
  <div class="section"><h2>⚠️ Lecții de reluat (sub 80%)</h2>${weak}</div>
  <div class="section"><h2>📝 Performanță teste</h2>${tests}</div>
  <div class="section"><h2>❌ Itemi cu cel mai mic punctaj</h2>${items}</div>
  <div class="footer">Raport generat automat de PyRo · ${esc(date)}</div>`;
}

const csvCell = (val: unknown): string => {
  const s = String(val ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function buildClassCsv(p: ClassReportPayload): string {
  const k = p.kpis;
  const lines: string[] = [];
  lines.push(`Raport clasă: ${p.className}`);
  lines.push(`Data: ${new Date().toLocaleDateString("ro-RO")}`);
  lines.push(`Elevi activi: ${k.activeStudents}/${k.totalStudents}`);
  lines.push(`Medie clasă: ${k.classAvg ?? "-"}`);
  lines.push(`Lecții finalizate: ${k.lessons} (recapitulări: ${k.reviews}, probleme: ${k.problems})`);
  lines.push(`Teste predate: ${k.submittedCount}${k.submissionRate !== null ? ` (${k.submissionRate}% din posibile)` : ""}`);
  lines.push(`Elevi cu risc: ${k.atRisk}`);
  lines.push("");

  lines.push("Elev,Lecții,Recapitulări,Probleme,Medie lecții (%),Medie teste (%),Teste predate,Ultima activitate,Streak,XP,Risc");
  p.rows.forEach((s) => {
    lines.push([
      csvCell(s.name), s.lessons, s.reviews, s.problems,
      s.avgLessonScore ?? "-", s.avgTestScore ?? "-", s.testsSubmitted,
      csvCell(fmtDate(s.lastActivity)), s.streak, s.xp,
      csvCell(s.riskReasons.join("; ")),
    ].join(","));
  });

  if (p.chapterProgress.length) {
    lines.push("");
    lines.push("Progres pe capitole");
    lines.push("Capitol,Lecții,Parcurs mediu (%),Medie scor (%),Elevi începuți,Elevi finalizat");
    p.chapterProgress.forEach((c) => {
      lines.push([csvCell(c.title), c.totalLessons, c.coverage, c.avgScore ?? "-", c.studentsStarted, c.studentsCompleted].join(","));
    });
  }

  if (p.competencies.length) {
    lines.push("");
    lines.push("Competențe la nivel de clasă");
    lines.push("Cod,Competență,Nivel,Mastery (%),Elevi evaluați");
    p.competencies.forEach((c) => {
      lines.push([
        csvCell(c.specificCode), csvCell(c.specificTitle),
        csvCell(masteryLevelLabel(c.mastery)), Math.round(c.mastery * 100), c.evaluatedStudents,
      ].join(","));
    });
  }

  if (p.weakLessons.length) {
    lines.push("");
    lines.push("Lecții de reluat (sub 80%)");
    lines.push("Lecție,Medie (%),Elevi,Încercări");
    p.weakLessons.forEach((l) => {
      lines.push([csvCell(l.name), l.avgScore, l.students, l.attempts].join(","));
    });
  }

  if (p.testStats.length) {
    lines.push("");
    lines.push("Performanță teste");
    lines.push("Test,Medie (%),Mediană (%),Min (%),Max (%),Sub 50%,Predate,Lipsă");
    p.testStats.forEach((t) => {
      lines.push([csvCell(t.title), t.avg, t.median, t.min, t.max, t.below50, t.count, t.missing].join(","));
    });
  }

  if (p.itemDifficulty.length) {
    lines.push("");
    lines.push("Itemi cu cel mai mic punctaj");
    lines.push("Item,Punctaj mediu (%),0 puncte,Parțial,Complet,Total");
    p.itemDifficulty.forEach((e) => {
      lines.push([csvCell(e.question), e.avgPercent, e.zeroCount, e.partialCount, e.fullCount, e.total].join(","));
    });
  }

  return lines.join("\n");
}
