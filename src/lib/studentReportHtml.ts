import type { StudentReportData } from "@/lib/studentReportData";
import { buildStudentInsights, masteryLevelLabel, type Insight } from "@/lib/studentInsights";

export function esc(val: unknown): string {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("ro-RO") : "-");

const scoreBadge = (pct: number | null) => {
  if (pct === null) return `<span class="badge">-</span>`;
  const cls = pct >= 80 ? "badge-good" : pct >= 50 ? "badge-mid" : "badge-bad";
  return `<span class="badge ${cls}">${pct}%</span>`;
};

/** Shared CSS for the per-student sections (used by both report types). */
export const STUDENT_SECTION_CSS = `
  .student-page { page-break-before: always; }
  .student-head { border-bottom: 2px solid #6d28d9; padding-bottom: 8px; margin-bottom: 12px; }
  .student-head h2 { font-size: 18px; color: #6d28d9; border: none; margin: 0; }
  .student-head p { color: #666; font-size: 10px; }
  .mini-kpis { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
  .mini-kpi { flex: 1; min-width: 90px; background: #f8f5ff; border: 1px solid #e9e0f7; border-radius: 6px; padding: 8px; text-align: center; }
  .mini-kpi .value { font-size: 16px; font-weight: bold; color: #6d28d9; }
  .mini-kpi .label { font-size: 9px; color: #666; }
  ul.insights { margin: 0 0 14px 16px; }
  ul.insights li { font-size: 11px; margin-bottom: 4px; }
  ul.insights li.bad { color: #991b1b; }
  ul.insights li.warn { color: #92400e; }
  ul.insights li.good { color: #166534; }
  .sub { color: #666; font-size: 10px; margin-bottom: 4px; }
  .test-block { margin-bottom: 10px; }
  .test-block h3 { font-size: 12px; margin-bottom: 3px; }
`;

const insightsHtml = (insights: Insight[]) =>
  `<ul class="insights">${insights
    .map((i) => `<li class="${i.tone}">${esc(i.text)}</li>`)
    .join("")}</ul>`;

const competencyTableHtml = (d: StudentReportData) => {
  const rows = d.competencies.filter((c) => Number(c.max_sum) > 0 || c.mastery !== null);
  if (rows.length === 0) return `<p class="sub">Nu există încă date de competențe pentru acest elev.</p>`;
  return `<table>
    <thead><tr><th>Competență generală</th><th>Competență specifică</th><th>Nivel</th><th>Mastery</th><th>Încercări</th></tr></thead>
    <tbody>
      ${rows
        .map((c) => {
          const pct = c.mastery === null ? null : Math.round(c.mastery * 100);
          return `<tr>
            <td>${esc(c.general_code)} ${esc(c.general_title)}</td>
            <td>${esc(c.specific_code)} ${esc(c.specific_title)}</td>
            <td>${esc(masteryLevelLabel(c.mastery))}</td>
            <td>${scoreBadge(pct)}</td>
            <td>${Number(c.attempts ?? 0)}</td>
          </tr>`;
        })
        .join("")}
    </tbody>
  </table>`;
};

const lessonsTableHtml = (d: StudentReportData) => {
  if (d.lessons.length === 0) return `<p class="sub">Nicio lecție finalizată.</p>`;
  return `<table>
    <thead><tr><th>Lecție</th><th>Capitol</th><th>Scor</th><th>Data</th></tr></thead>
    <tbody>
      ${d.lessons
        .map(
          (l) => `<tr>
            <td>${esc(l.title)}</td>
            <td>${esc(l.chapterTitle ?? "-")}</td>
            <td>${scoreBadge(l.score)}</td>
            <td>${fmtDate(l.completedAt)}</td>
          </tr>`
        )
        .join("")}
    </tbody>
  </table>`;
};

const testsHtml = (d: StudentReportData) => {
  if (d.tests.length === 0) return `<p class="sub">Niciun test predat.</p>`;
  return d.tests
    .map(
      (t) => `<div class="test-block">
        <h3>${esc(t.testTitle)} — ${scoreBadge(t.percent)} (${t.totalScore ?? 0}/${t.maxScore ?? 0}p) · ${fmtDate(t.submittedAt)}</h3>
        ${
          t.wrongItems.length === 0
            ? `<p class="sub">Toți itemii au punctaj maxim.</p>`
            : `<table>
                <thead><tr><th>Item greșit / parțial</th><th>Tip</th><th>Punctaj</th></tr></thead>
                <tbody>${t.wrongItems
                  .map(
                    (it) =>
                      `<tr><td>${esc(it.question)}</td><td>${esc(it.itemType ?? "-")}</td><td><span class="badge badge-bad">${it.score}/${it.maxPoints}p</span></td></tr>`
                  )
                  .join("")}</tbody>
              </table>`
        }
      </div>`
    )
    .join("");
};

const problemsHtml = (d: StudentReportData) => {
  if (d.problemsSolved === 0) return `<p class="sub">Nicio problemă rezolvată.</p>`;
  return `<table>
    <thead><tr><th>Capitol</th><th>Probleme rezolvate</th></tr></thead>
    <tbody>${d.problemsByChapter
      .map((p) => `<tr><td>${esc(p.chapterTitle)}</td><td>${p.solved}</td></tr>`)
      .join("")}</tbody>
  </table>`;
};

const missingHtml = (d: StudentReportData) => {
  if (d.missingLessons.length === 0) return `<p class="sub">A parcurs toate lecțiile disponibile. 🎉</p>`;
  return `<p class="sub">${d.missingLessons.length} lecții neparcurse:</p>
    <p style="font-size:10.5px">${d.missingLessons
      .slice(0, 30)
      .map((l) => `${esc(l.title)} <span style="color:#999">(${esc(l.chapterTitle)})</span>`)
      .join(" · ")}${d.missingLessons.length > 30 ? " …" : ""}</p>`;
};

/** One student's full section — reused inside the class report and standalone PDF. */
export function buildStudentSectionHtml(d: StudentReportData, withPageBreak = true): string {
  const insights = buildStudentInsights(d);
  return `
  <div class="${withPageBreak ? "student-page" : ""}">
    <div class="student-head">
      <h2>👤 ${esc(d.name)}</h2>
      <p>Ultima activitate: ${fmtDate(d.lastActivity)}</p>
    </div>
    <div class="mini-kpis">
      <div class="mini-kpi"><div class="value">${d.xp}</div><div class="label">XP</div></div>
      <div class="mini-kpi"><div class="value">${d.streak}</div><div class="label">Streak</div></div>
      <div class="mini-kpi"><div class="value">${d.lessons.length}</div><div class="label">Lecții</div></div>
      <div class="mini-kpi"><div class="value">${d.avgLessonScore ?? "-"}${d.avgLessonScore !== null ? "%" : ""}</div><div class="label">Medie lecții</div></div>
      <div class="mini-kpi"><div class="value">${d.avgTestScore ?? "-"}${d.avgTestScore !== null ? "%" : ""}</div><div class="label">Medie teste</div></div>
      <div class="mini-kpi"><div class="value">${d.problemsSolved}</div><div class="label">Probleme</div></div>
    </div>

    <div class="section"><h2>💡 Recomandări</h2>${insightsHtml(insights)}</div>
    <div class="section"><h2>🎯 Profil de competențe (CG / CS)</h2>${competencyTableHtml(d)}</div>
    <div class="section"><h2>📚 Lecții finalizate</h2>${lessonsTableHtml(d)}</div>
    <div class="section"><h2>📝 Teste — detaliu per item</h2>${testsHtml(d)}</div>
    <div class="section"><h2>🧩 Probleme rezolvate</h2>${problemsHtml(d)}</div>
    <div class="section"><h2>⏳ Lecții neparcurse</h2>${missingHtml(d)}</div>
  </div>`;
}

export const BASE_REPORT_CSS = `
  @page { size: A4; margin: 16mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 12px; line-height: 1.5; }
  .section { margin-bottom: 16px; }
  .section h2 { font-size: 13px; color: #1a1a1a; margin-bottom: 6px; padding-bottom: 3px; border-bottom: 1px solid #e5e7eb; }
  table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  th { background: #f3f0ff; color: #6d28d9; text-align: left; padding: 5px 6px; font-weight: 600; }
  td { padding: 4px 6px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  tr:nth-child(even) td { background: #fafafa; }
  .badge { display: inline-block; padding: 1px 5px; border-radius: 4px; font-size: 10px; font-weight: 600; }
  .badge-good { background: #dcfce7; color: #166534; }
  .badge-mid { background: #fef3c7; color: #92400e; }
  .badge-bad { background: #fee2e2; color: #991b1b; }
  .footer { margin-top: 24px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 6px; }
`;

/** Opens a print window with the given body; returns false if popups blocked. */
export function openPrintDocument(title: string, bodyHtml: string, css: string): boolean {
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${css}</style></head><body>${bodyHtml}</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
  return true;
}

/** Standalone per-student PDF. */
export function exportStudentPdf(d: StudentReportData, className?: string): boolean {
  const date = new Date().toLocaleDateString("ro-RO");
  const body = `
    <div style="text-align:center;margin-bottom:14px">
      <h1 style="font-size:20px;color:#6d28d9">Raport individual</h1>
      <p style="color:#666;font-size:10px">${esc(className ? `${className} · ` : "")}Generat pe ${esc(date)} · PyRo</p>
    </div>
    ${buildStudentSectionHtml(d, false)}
    <div class="footer">Raport generat automat de PyRo · ${esc(date)}</div>`;
  return openPrintDocument(`Raport ${d.name}`, body, BASE_REPORT_CSS + STUDENT_SECTION_CSS);
}
