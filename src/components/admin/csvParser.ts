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
  error?: string;
}

export interface ParsedLessonMeta {
  title: string;
  description?: string;
  xp_reward?: number;
}

const VALID_TYPES = ["quiz", "truefalse", "fill", "order", "card", "open_answer", "problem", "match"];

function detectSeparator(text: string): string {
  const firstLine = text.split("\n")[0];
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

function parseCSVRows(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const sep = detectSeparator(text);
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0], sep).map(h => h.toLowerCase().trim());
  const rows = lines.slice(1).map(line => {
    const values = parseCSVLine(line, sep);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
    return obj;
  });
  return { headers, rows };
}

function rowToExercise(row: Record<string, string>): ParsedExercise {
  const type = row.type?.toLowerCase().trim();
  if (!type || !VALID_TYPES.includes(type)) {
    return { type: type || "unknown", question: row.question || "", error: `Tip invalid: "${type}"` };
  }

  const ex: ParsedExercise = { type, question: row.question || "" };
  ex.explanation = row.explanation || null;
  ex.xp = row.xp ? parseInt(row.xp) : 5;

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
      ex.statement = row.statement || row.question || "";
      ex.question = ex.statement;
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
    case "card":
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
  const lines = text.split(/\r?\n/);
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
  const headers = ["type", "question", "option_a", "option_b", "option_c", "option_d", "correct", "explanation", "code_template", "blanks", "lines", "statement", "is_true", "groups", "solution", "test_cases"];
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
    return headers.map(h => escape(r[h] || "")).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export function getExercisesTemplateCSV(): string {
  const headers = "type,question,option_a,option_b,option_c,option_d,correct,explanation,code_template,blanks,lines,statement,is_true,groups,solution,test_cases";
  const rows = [
    'quiz,Ce tip de date este 3.14?,int,float,str,bool,b,3.14 este un număr zecimal deci float,,,,,,,,',
    'truefalse,,,,,,,Python este un limbaj interpretat,,,,"Python este un limbaj interpretat",True,,,',
    'fill,Completează codul pentru a afișa mesajul:,,,,,,Se folosește funcția print(),"print(___)",...print(\'Salut\')...;...print(\"Bună\")...,,,,,',
    'order,Ordonează pașii pentru a citi un fișier:,,,,,,,"f = open(\'date.txt\')|continut = f.read()|print(continut)|f.close()",,,,,1|2|3|4,',
    'card,"**Liste în Python**\n\nListele sunt colecții ordonate de elemente.\n\n```python\nfructe = [\'măr\', \'pară\', \'banană\']\n```",,,,,,,,,,,,,,',
    'open_answer,Explică diferența dintre o listă și un tuplu în Python.,,,,,,Răspunsul trebuie să menționeze mutabilitatea,,,,,,,,',
    'problem,"Scrie o funcție care returnează suma numerelor pare dintr-o listă.",,,,,,,,"def suma_pare(lista):\n    return sum(x for x in lista if x % 2 == 0)",,,,,"[1,2,3,4]:6|[2,4,6]:12|[1,3,5]:0"',
  ];
  return [headers, ...rows].join("\n");
}

export function getLessonTemplateCSV(): string {
  return `[META]
title,Introducere în Python
description,Lecție introductivă despre bazele limbajului Python
xp_reward,25
[EXERCISES]
type,question,option_a,option_b,option_c,option_d,correct,explanation,code_template,blanks,lines,statement,is_true,groups,solution,test_cases
quiz,Care este extensia fișierelor Python?,.java,.py,.js,.cpp,b,Fișierele Python au extensia .py,,,,,,,,
truefalse,,,,,,,Python folosește indentarea pentru blocuri de cod,,,,Python folosește indentarea pentru a delimita blocurile de cod,True,,,
fill,Completează pentru a defini o variabilă:,,,,,,Variabilele se definesc prin atribuire,"___ = 10",x;numar;n,,,,,
order,Ordonează pașii unui program simplu:,,,,,,,,,"x = 5|y = 3|suma = x + y|print(suma)",,,1|2|3|4,
card,"**Tipuri de date de bază**\n\n- **int** – numere întregi\n- **float** – numere zecimale\n- **str** – șiruri de caractere\n- **bool** – True / False",,,,,,,,,,,,,,
open_answer,De ce crezi că Python este popular printre începători?,,,,,,,,,,,,,,`;
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
