// CSV parser utility for exercise/lesson imports

export interface ParsedExercise {
  type: string;
  question: string;
  options?: { id: string; text: string }[] | null;
  correct_option_id?: string | null;
  blanks?: { id: string; answer: string }[] | null;
  lines?: { id: string; text: string; order: number; group?: number }[] | null;
  statement?: string | null;
  is_true?: boolean | null;
  explanation?: string | null;
  code_template?: string | null;
  solution?: string | null;
  test_cases?: { input: string; expected_output: string; hidden: boolean }[] | null;
  xp?: number;
  competencies?: string[];
  error?: string;
}

export interface ParsedLessonMeta {
  title: string;
  description?: string;
  xp_reward?: number;
}

const VALID_TYPES = ["quiz", "truefalse", "fill", "order", "card", "open_answer", "problem", "match"];

export const CONTENT_TYPES = ["quiz", "truefalse", "fill", "order", "card", "match"];
export const EVAL_TYPES = ["quiz", "truefalse", "fill", "order", "card", "open_answer", "problem"];
export const MANUAL_TYPES = ["quiz", "truefalse", "fill", "order", "card", "open_answer", "problem", "match"];

function splitLogicalLines(text: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === '\r') {
      // skip \r, handle \n next
      continue;
    } else if (ch === '\n' && !inQuotes) {
      lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function detectSeparator(text: string): string {
  const firstLine = splitLogicalLines(text)[0] || "";
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  return semiCount > commaCount ? ";" : ",";
}

function parseCSVLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === sep && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Auto-repair a CSV row that has more fields than headers.
 * Strategy: merge excess fields back into the longest text column
 * (likely question, explanation, or statement that contained unquoted commas).
 */
function autoRepairRow(values: string[], headerCount: number, headers: string[]): string[] {
  if (values.length <= headerCount) return values;

  const textCols = ["question", "explanation", "statement", "code_template"];
  // Find the rightmost text column index — that's the most likely split point
  let bestIdx = -1;
  for (const col of textCols) {
    const idx = headers.indexOf(col);
    if (idx !== -1 && idx > bestIdx) bestIdx = idx;
  }

  // Try each text column from right to left: merge excess fields at that position
  for (const col of [...textCols].reverse()) {
    const idx = headers.indexOf(col);
    if (idx === -1 || idx >= values.length) continue;

    const excess = values.length - headerCount;
    // Merge fields [idx .. idx+excess] into one
    const merged = values.slice(idx, idx + excess + 1).join(",");
    const repaired = [...values.slice(0, idx), merged, ...values.slice(idx + excess + 1)];
    if (repaired.length === headerCount) return repaired;
  }

  // Fallback: just merge all excess into the last known text column
  if (bestIdx !== -1) {
    const excess = values.length - headerCount;
    const merged = values.slice(bestIdx, bestIdx + excess + 1).join(",");
    return [...values.slice(0, bestIdx), merged, ...values.slice(bestIdx + excess + 1)];
  }

  return values;
}

function parseCSVRows(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const sep = detectSeparator(text);
  // Filter out empty lines AND comment lines starting with # (after trim)
  const lines = splitLogicalLines(text).filter(l => {
    const t = l.trim();
    return t.length > 0 && !t.startsWith("#");
  });
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0], sep).map(h => h.toLowerCase().trim());
  const rows = lines.slice(1).map(line => {
    let values = parseCSVLine(line, sep);
    if (values.length > headers.length) {
      values = autoRepairRow(values, headers.length, headers);
    }
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
    return obj;
  });
  return { headers, rows };
}

/**
 * Preserve single line breaks from CSV cells when rendering as Markdown.
 * Markdown collapses single \n into spaces, so we convert each \n into
 * a hard line break ("  \n"), unless the line is already part of a
 * fenced code block (```), to avoid breaking ```python ... ```.
 */
function preserveLineBreaks(text: string): string {
  if (!text) return text;
  // Normalize \r\n
  let t = text.replace(/\r\n/g, "\n");
  // Split by fenced code blocks so we don't touch their internals
  const parts = t.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part; // inside ``` block, keep as-is
      // Add two spaces before each \n that isn't already preceded by spaces
      return part.replace(/([^ \n])\n(?!\n)/g, "$1  \n");
    })
    .join("");
}

function rowToExercise(row: Record<string, string>): ParsedExercise {
  const type = row.type?.toLowerCase().trim();
  if (!type || !VALID_TYPES.includes(type)) {
    return { type: type || "unknown", question: preserveLineBreaks(row.question || ""), error: `Tip invalid: "${type}"` };
  }

  const ex: ParsedExercise = { type, question: preserveLineBreaks(row.question || "") };
  ex.explanation = row.explanation ? preserveLineBreaks(row.explanation) : null;
  ex.xp = row.xp ? parseInt(row.xp) : 5;
  // Parse competencies (codes separated by ;)
  if (row.competencies) {
    ex.competencies = row.competencies
      .split(";")
      .map(c => c.trim().toUpperCase())
      .filter(c => c.length > 0);
  }

  switch (type) {
    case "quiz": {
      const opts = ["a", "b", "c", "d"]
        .map(id => ({ id, text: row[`option_${id}`] || "" }))
        .filter(o => o.text);
      if (opts.length < 2) { ex.error = "Quiz necesită cel puțin 2 opțiuni"; break; }
      ex.options = opts;
      const correct = row.correct?.toLowerCase().trim();
      if (!correct || !opts.find(o => o.id === correct)) { ex.error = "Răspuns corect lipsă sau invalid"; break; }
      ex.correct_option_id = correct;
      break;
    }
    case "truefalse": {
      ex.statement = preserveLineBreaks(row.statement || row.question || "");
      ex.question = row.question?.trim() || ex.statement;
      if (!ex.statement) { ex.error = "Afirmație lipsă"; break; }
      const val = row.is_true?.toLowerCase().trim();
      if (val === "true" || val === "adevărat" || val === "1" || val === "da") ex.is_true = true;
      else if (val === "false" || val === "fals" || val === "0" || val === "nu") ex.is_true = false;
      else { ex.error = "is_true trebuie să fie True/False"; break; }
      break;
    }
    case "fill": {
      ex.code_template = row.code_template || null;
      const blanksStr = row.blanks || "";
      if (!blanksStr) { ex.error = "Blanks lipsă"; break; }
      // blanks separate prin ; iar variante prin |
      ex.blanks = blanksStr.split(";").map((b, i) => ({ id: `b${i + 1}`, answer: b.trim() }));
      break;
    }
    case "order": {
      const linesStr = row.lines || "";
      if (!linesStr) { ex.error = "Lines lipsă"; break; }
      const lineTexts = linesStr.split("|");
      const groupsStr = row.groups || "";
      const groups = groupsStr ? groupsStr.split("|").map(g => g.trim() ? Number(g.trim()) : undefined) : [];
      ex.lines = lineTexts.map((text, i) => ({
        id: `l${i + 1}`, text: text.trim(), order: i + 1,
        group: groups[i] !== undefined ? groups[i] : undefined,
      }));
      break;
    }
    case "card": {
      if (!ex.question) { ex.error = "Întrebare lipsă"; break; }
      // Auto-split: dacă explanation lipsește dar question conține un titlu (bold pe primul rând non-gol)
      // urmat de mai mult conținut, mutăm restul în explanation.
      if (!ex.explanation) {
        const raw = (row.question || "").replace(/\r\n/g, "\n");
        const lines = raw.split("\n");
        // găsește primul rând non-gol
        let i = 0;
        while (i < lines.length && lines[i].trim() === "") i++;
        const firstLine = (lines[i] || "").trim();
        const isBoldTitle = /^\*\*.+\*\*$/.test(firstLine) || /^#{1,6}\s+/.test(firstLine);
        if (isBoldTitle && i + 1 < lines.length) {
          const rest = lines.slice(i + 1).join("\n").replace(/^\n+/, "").trimEnd();
          if (rest.length > 0) {
            ex.question = preserveLineBreaks(firstLine.replace(/^\*\*|\*\*$/g, "").replace(/^#{1,6}\s+/, ""));
            ex.explanation = preserveLineBreaks(rest);
          }
        }
      }
      break;
    }
    case "open_answer":
      if (!ex.question) ex.error = "Întrebare lipsă";
      break;
    case "problem": {
      ex.code_template = row.code_template || null;
      ex.solution = row.solution || "";
      if (!ex.solution) { ex.error = "Soluție lipsă"; break; }
      const tcStr = row.test_cases || "";
      if (tcStr) {
        // format: input1:output1|input2:output2
        ex.test_cases = tcStr.split("|").map(tc => {
          const [input, expected] = tc.split(":");
          return { input: (input || "").trim(), expected_output: (expected || "").trim(), hidden: false };
        });
      } else {
        ex.test_cases = [];
      }
      break;
    }
  }

  return ex;
}

export function parseExercisesCSV(text: string): { exercises: ParsedExercise[]; errors: string[] } {
  const { rows } = parseCSVRows(text);
  const exercises = rows.map(rowToExercise);
  const errors = exercises
    .map((ex, i) => ex.error ? `Rând ${i + 2}: ${ex.error}` : null)
    .filter(Boolean) as string[];
  return { exercises, errors };
}

export function parseLessonCSV(text: string): { meta: ParsedLessonMeta | null; exercises: ParsedExercise[]; errors: string[] } {
  // Strip comment lines (#) before searching for sections
  const lines = splitLogicalLines(text).filter(l => !l.trim().startsWith("#"));
  const metaStart = lines.findIndex(l => l.trim().toUpperCase() === "[META]");
  const exStart = lines.findIndex(l => l.trim().toUpperCase() === "[EXERCISES]");

  if (metaStart === -1 || exStart === -1) {
    return { meta: null, exercises: [], errors: ["Fișierul trebuie să conțină secțiunile [META] și [EXERCISES]"] };
  }

  // Parse META
  const metaLines = lines.slice(metaStart + 1, exStart);
  const sep = detectSeparator(metaLines.join("\n") || ",");
  const meta: ParsedLessonMeta = { title: "" };
  for (const ml of metaLines) {
    const parts = parseCSVLine(ml, sep);
    const key = parts[0]?.toLowerCase().trim();
    const val = parts[1]?.trim() || "";
    if (key === "title") meta.title = val;
    else if (key === "description") meta.description = val;
    else if (key === "xp_reward") meta.xp_reward = parseInt(val) || 20;
  }

  if (!meta.title) {
    return { meta: null, exercises: [], errors: ["Titlul lecției lipsă din [META]"] };
  }

  // Parse EXERCISES
  const exerciseText = lines.slice(exStart + 1).join("\n");
  const { exercises, errors } = parseExercisesCSV(exerciseText);

  return { meta, exercises, errors };
}

export function exerciseToDbRow(ex: ParsedExercise, lessonId: string, sortOrder: number, idPrefix: string = "") {
  const id = `${idPrefix}e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id, lesson_id: lessonId, type: ex.type, question: ex.question,
    options: ex.options ? JSON.parse(JSON.stringify(ex.options)) : null,
    correct_option_id: ex.correct_option_id || null,
    code_template: ex.code_template || null,
    blanks: ex.blanks ? JSON.parse(JSON.stringify(ex.blanks)) : null,
    lines: ex.lines ? JSON.parse(JSON.stringify(ex.lines)) : null,
    statement: ex.statement || null,
    is_true: ex.is_true ?? null,
    explanation: ex.explanation || null,
    sort_order: sortOrder,
    solution: ex.solution || null,
    test_cases: ex.test_cases ? JSON.parse(JSON.stringify(ex.test_cases)) : null,
    xp: ex.xp || 5,
  };
}

export function generateExportCSV(exercises: any[]): string {
  const headers = ["type", "question", "option_a", "option_b", "option_c", "option_d", "correct", "explanation", "code_template", "blanks", "lines", "statement", "is_true", "groups", "solution", "test_cases", "competencies"];
  const escape = (v: string) => v.includes(",") || v.includes('"') || v.includes("\n") ? `"${v.replace(/"/g, '""')}"` : v;

  const rows = exercises.map(ex => {
    const r: Record<string, string> = { type: ex.type, question: ex.question || "" };
    if (ex.options && Array.isArray(ex.options)) {
      for (const o of ex.options) r[`option_${o.id}`] = o.text || "";
      r.correct = ex.correct_option_id || ex.correctOptionId || "";
    }
    r.explanation = ex.explanation || "";
    r.code_template = ex.code_template || ex.codeTemplate || "";
    if (ex.blanks && Array.isArray(ex.blanks)) {
      r.blanks = ex.blanks.map((b: any) => b.answer).join(";");
    }
    if (ex.lines && Array.isArray(ex.lines)) {
      r.lines = ex.lines.map((l: any) => l.text).join("|");
      r.groups = ex.lines.map((l: any) => l.group ?? "").join("|");
    }
    r.statement = ex.statement || "";
    r.is_true = ex.is_true != null ? (ex.is_true ? "True" : "False") : "";
    r.solution = ex.solution || "";
    if (ex.test_cases && Array.isArray(ex.test_cases)) {
      r.test_cases = ex.test_cases.map((tc: any) => `${tc.input}:${tc.expected_output}`).join("|");
    }
    if (ex.competencies && Array.isArray(ex.competencies)) {
      r.competencies = ex.competencies.join(";");
    }
    return headers.map(h => escape(r[h] || "")).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export function getExercisesTemplateCSV(): string {
  const headers = "type,question,option_a,option_b,option_c,option_d,correct,explanation,code_template,blanks,lines,statement,is_true,groups,solution,test_cases,competencies";
  const rows = [
    'quiz,"Ce tip de date este 3.14?",int,float,str,bool,b,"3.14 este un număr zecimal, deci float",,,,,,,,,M21',
    'truefalse,,,,,,,"Python este un limbaj interpretat",,,,"Python este un limbaj interpretat",True,,,,M21',
    'fill,"Completează codul pentru a afișa mesajul:",,,,,,,"Se folosește funcția print()","print(___)",...print(\'Salut\')...;...print(\"Bună\")...,,,,,,M18',
    'order,"Ordonează pașii pentru a citi un fișier:",,,,,,,"f = open(\'date.txt\')|continut = f.read()|print(continut)|f.close()",,,,,1|2|3|4,,M10',
    'card,"**Liste în Python**\n\nListele sunt colecții ordonate de elemente.\n\n```python\nfructe = [\'măr\', \'pară\', \'banană\']\n```",,,,,,,,,,,,,,,M61',
    'open_answer,"Explică diferența dintre o listă și un tuplu în Python.",,,,,,"Răspunsul trebuie să menționeze mutabilitatea",,,,,,,,,M61;M21',
    'problem,"Scrie o funcție care returnează suma numerelor pare dintr-o listă.",,,,,,,,"def suma_pare(lista):\n    return sum(x for x in lista if x % 2 == 0)",,,,,"[1,2,3,4]:6|[2,4,6]:12|[1,3,5]:0",M61;M82',
  ];
  return [headers, ...rows].join("\n");
}

/**
 * Template lecție pentru capitole de conținut (lessons + exercises).
 * Conține exemplu COMPLET cu fiecare tip permis: card, quiz, truefalse, fill, order.
 * Liniile care încep cu # sunt comentarii și sunt ignorate la import.
 */
export function getContentLessonTemplateCSV(): string {
  return `# ============================================================
# TEMPLATE LECȚIE DE CONȚINUT (capitol normal)
# Liniile care încep cu # sunt comentarii și sunt ignorate.
# Coloana "competencies" e opțională: coduri micro separate prin ;
# Exemple coduri: M21, M61, M82 (vezi butonul "Vezi microcompetențele")
# ============================================================

[META]
title,Liste în Python
description,Lecție introductivă despre liste — creare, accesare, modificare
xp_reward,25

[EXERCISES]
type,question,option_a,option_b,option_c,option_d,correct,explanation,code_template,blanks,lines,statement,is_true,groups,solution,test_cases,competencies
# --- 1) CARD: teorie/explicație. Doar "question" contează, suportă Markdown. ---
card,"**Listele în Python**\\n\\nListele sunt colecții ordonate, mutabile, care pot conține orice tip de date.\\n\\n\`\`\`python\\nfructe = ['măr', 'pară', 'banană']\\n\`\`\`",,,,,,,,,,,,,,,M61
# --- 2) QUIZ: 4 opțiuni a-d, "correct" indică litera răspunsului corect. ---
quiz,"Ce este o listă în Python?",Un șir imutabil,O colecție ordonată mutabilă,Un dicționar,Un tuplu,b,"Listele sunt ordonate și mutabile.",,,,,,,,,M61
# --- 3) TRUEFALSE: completează "statement" și "is_true" (True/False). ---
truefalse,,,,,,,"Listele permit modificarea elementelor după creare.",,,,Listele sunt mutabile,True,,,,M61;M21
# --- 4) FILL: "code_template" cu ___ pentru spații; "blanks" = răspunsuri separate prin ; ---
#       Variante alternative pentru același spațiu se separă prin | (ex: append|adauga).
fill,"Adaugă elementul 5 la sfârșitul listei l:",,,,,,"Metoda append() adaugă la sfârșit.","l.___(5)",append,,,,,,,M61
# --- 5) ORDER: "lines" separate prin |, ordinea corectă e cea scrisă. ---
#       "groups" (opțional) marchează linii interschimbabile (același număr = orice ordine OK).
order,"Ordonează pașii pentru a parcurge o listă:",,,,,,"Prima linie creează lista, apoi for, apoi print.",,,"l = [1,2,3]|for x in l:|    print(x)",,,1|2|3,,,M61`;
}

/**
 * Template lecție pentru bancă de evaluare (eval_lessons + eval_exercises).
 * Include în plus open_answer și problem.
 */
export function getLessonTemplateCSV(): string {
  return `# ============================================================
# TEMPLATE LECȚIE BANCĂ DE EVALUARE
# Tipuri permise: quiz, truefalse, fill, order, card, open_answer, problem
# Coloana "competencies" e opțională (coduri micro separate prin ;).
# Liniile care încep cu # sunt comentarii.
# ============================================================

[META]
title,Liste — Bancă evaluare
description,Itemi de evaluare pentru capitolul Liste
xp_reward,25

[EXERCISES]
type,question,option_a,option_b,option_c,option_d,correct,explanation,code_template,blanks,lines,statement,is_true,groups,solution,test_cases,competencies
# --- CARD (teorie scurtă, suportă Markdown) ---
card,"**Recapitulare liste**\\n\\nO listă este ordonată și mutabilă.",,,,,,,,,,,,,,,M61
# --- QUIZ ---
quiz,"Ce returnează len([1,2,3])?",1,2,3,4,c,"len() returnează numărul de elemente.",,,,,,,,,M61
# --- TRUEFALSE ---
truefalse,,,,,,,"Tuplurile sunt mutabile.",,,,Tuplurile sunt mutabile,False,,,,M21
# --- FILL: variante alternative separate prin | (ex: print('Salut')|print(\"Salut\")) ---
fill,"Afișează pe ecran textul Salut:",,,,,,"Folosește funcția print().","___(\"Salut\")",print,,,,,,,M18
# --- ORDER cu groups: liniile cu același group sunt interschimbabile ---
order,"Ordonează deschiderea, citirea și închiderea unui fișier:",,,,,,,"f = open('date.txt')|continut = f.read()|f.close()",,,1|2|3,,,M10
# --- OPEN_ANSWER: răspuns liber (corectare manuală sau AI) ---
open_answer,"Explică, în 2-3 fraze, diferența dintre o listă și un tuplu.",,,,,,"Răspunsul ideal menționează mutabilitatea și sintaxa.",,,,,,,,,M61;M21
# --- PROBLEM: cod Python, "solution" = referință, "test_cases" = input:output|input2:output2 ---
#       Inputul poate fi reprezentare Python a argumentului (ex: [1,2,3,4]).
problem,"Scrie funcția suma_pare(lista) care returnează suma numerelor pare din listă.",,,,,,,,"def suma_pare(lista):\\n    return sum(x for x in lista if x % 2 == 0)",,,,,"[1,2,3,4]:6|[2,4,6]:12|[1,3,5]:0",M61;M82`;
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
