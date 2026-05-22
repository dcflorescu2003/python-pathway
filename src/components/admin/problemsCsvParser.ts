// CSV parser dedicated to the `problems` table.
// Self-contained (does not depend on csvParser.ts) to keep semantics simple.

export type ParsedKind = "execute" | "static";

export interface ParsedStaticCheck {
  description: string;
  type: "import" | "call" | "regex";
  pattern: string;
  hidden: boolean;
}

export interface ParsedTestCase {
  input: string;
  expectedOutput: string;
  hidden: boolean;
  inputFiles?: Record<string, string>;
  expectedFiles?: Record<string, string>;
}

export interface ParsedProblem {
  title: string;
  description: string;
  difficulty: "ușor" | "mediu" | "greu";
  xp_reward: number;
  hint: string | null;
  solution: string;
  is_premium: boolean;
  kind: ParsedKind;
  test_cases: ParsedTestCase[];
  static_checks: ParsedStaticCheck[];
  competencies: string[];
  error?: string;
}

const normalizeDifficulty = (s: string): "ușor" | "mediu" | "greu" => {
  const v = (s || "").trim().toLowerCase();
  if (v === "usor" || v === "ușor") return "ușor";
  if (v === "mediu") return "mediu";
  if (v === "greu") return "greu";
  return "ușor";
};

// ---------- low-level CSV ----------

function splitLogicalLines(text: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === "\r") {
      continue;
    } else if (ch === "\n" && !inQuotes) {
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
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// Convert literal \n / \t escapes within a cell into real characters.
function unescapeCell(s: string): string {
  return s.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\r/g, "");
}

// Parse a files-cell into per-case file maps.
// Format: cases separated by "@@", files within case by ";;", name|content by "|".
// Returns one Record per case (or empty Record if a case has no files).
function parseFilesCell(raw: string): Record<string, string>[] {
  if (!raw || !raw.trim()) return [];
  return raw.split("@@").map((caseChunk) => {
    const files: Record<string, string> = {};
    if (!caseChunk.trim()) return files;
    for (const filePart of caseChunk.split(";;")) {
      if (!filePart.trim()) continue;
      const pipe = filePart.indexOf("|");
      if (pipe === -1) continue;
      const name = filePart.slice(0, pipe).trim();
      const content = unescapeCell(filePart.slice(pipe + 1));
      if (name) files[name] = content;
    }
    return files;
  });
}

function serializeFilesCell(perCase: Array<Record<string, string> | undefined>): string {
  if (!perCase.some((c) => c && Object.keys(c).length > 0)) return "";
  return perCase
    .map((files) => {
      if (!files) return "";
      return Object.entries(files)
        .map(([n, c]) => `${n}|${escapeCell(c)}`)
        .join(";;");
    })
    .join("@@");
}

// ---------- public ----------

export interface ParseResult {
  problems: ParsedProblem[];
  errors: string[];
}

export function parseProblemsCSV(text: string): ParseResult {
  const errors: string[] = [];
  const sep = detectSeparator(text);
  const rawLines = splitLogicalLines(text).filter((l) => {
    const t = l.trim();
    return t.length > 0 && !t.startsWith("#");
  });
  if (rawLines.length < 2) {
    return { problems: [], errors: ["CSV gol sau fără rânduri de date."] };
  }
  const headers = parseCSVLine(rawLines[0], sep).map((h) => h.trim().toLowerCase());

  const idx = (name: string) => headers.indexOf(name);
  if (idx("title") === -1) {
    return { problems: [], errors: ['Lipsește coloana obligatorie "title".'] };
  }

  const problems: ParsedProblem[] = [];
  for (let r = 1; r < rawLines.length; r++) {
    const cells = parseCSVLine(rawLines[r], sep).map((c) => {
      let v = c;
      if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
        v = v.slice(1, -1).replace(/""/g, '"');
      }
      return v;
    });

    const get = (col: string) => {
      const i = idx(col);
      return i === -1 ? "" : (cells[i] ?? "");
    };

    const title = get("title").trim();
    if (!title) {
      problems.push({
        title: "", description: "", difficulty: "ușor", xp_reward: 10,
        hint: null, solution: "", is_premium: false, kind: "execute",
        test_cases: [], static_checks: [], competencies: [],
        error: `Rând ${r + 1}: title gol`,
      });
      continue;
    }

    const description = unescapeCell(get("description"));
    const difficulty = normalizeDifficulty(get("difficulty"));
    const xpRaw = get("xp_reward").trim();
    const xp_reward = xpRaw ? parseInt(xpRaw, 10) : 10;
    const hintRaw = unescapeCell(get("hint")).trim();
    const hint = hintRaw.length > 0 ? hintRaw : null;
    const solution = unescapeCell(get("solution"));
    const isPremRaw = get("is_premium").trim().toLowerCase();
    const is_premium = isPremRaw === "true" || isPremRaw === "1" || isPremRaw === "yes" || isPremRaw === "da";

    const kindRaw = get("kind").trim().toLowerCase();
    const kind: ParsedKind = kindRaw === "static" ? "static" : "execute";

    // test_cases: cases separated by ";", fields by ">>"
    // Each case: input>>expectedOutput>>hidden(0/1)
    const test_cases: ParsedTestCase[] = [];
    const testCasesRaw = get("test_cases");
    if (testCasesRaw.trim()) {
      const cases = testCasesRaw.split(";").map((c) => c.trim()).filter(Boolean);
      for (const c of cases) {
        const parts = c.split(">>");
        test_cases.push({
          input: unescapeCell(parts[0] ?? ""),
          expectedOutput: unescapeCell(parts[1] ?? ""),
          hidden: (parts[2] || "0").trim() === "1",
        });
      }
    }

    // input_files / expected_files: per-case file maps aligned by index
    const inFiles = parseFilesCell(get("input_files"));
    const outFiles = parseFilesCell(get("expected_files"));
    const maxCases = Math.max(test_cases.length, inFiles.length, outFiles.length);
    while (test_cases.length < maxCases) {
      test_cases.push({ input: "", expectedOutput: "", hidden: false });
    }
    for (let i = 0; i < maxCases; i++) {
      if (inFiles[i] && Object.keys(inFiles[i]).length > 0) test_cases[i].inputFiles = inFiles[i];
      if (outFiles[i] && Object.keys(outFiles[i]).length > 0) test_cases[i].expectedFiles = outFiles[i];
    }

    // static_checks: cases separated by ";", fields by ">>"
    // Each: description>>type>>pattern>>hidden(0/1)
    const static_checks: ParsedStaticCheck[] = [];
    const staticRaw = get("static_checks");
    if (staticRaw.trim()) {
      const cases = staticRaw.split(";").map((c) => c.trim()).filter(Boolean);
      for (const c of cases) {
        const parts = c.split(">>");
        if (parts.length < 3) continue;
        const t = (parts[1] || "").trim().toLowerCase();
        if (t !== "import" && t !== "call" && t !== "regex") continue;
        static_checks.push({
          description: unescapeCell(parts[0]),
          type: t as "import" | "call" | "regex",
          pattern: unescapeCell(parts[2]),
          hidden: (parts[3] || "0").trim() === "1",
        });
      }
    }

    const compsRaw = get("competencies");
    const competencies = compsRaw
      ? compsRaw.split("|").map((c) => c.trim().toUpperCase()).filter(Boolean)
      : [];

    if (Number.isNaN(xp_reward)) {
      problems.push({
        title, description, difficulty, xp_reward: 10, hint, solution, is_premium,
        kind, test_cases, static_checks, competencies,
        error: `Rând ${r + 1}: xp_reward invalid`,
      });
      continue;
    }

    if (kind === "static" && static_checks.length === 0) {
      problems.push({
        title, description, difficulty, xp_reward, hint, solution, is_premium,
        kind, test_cases, static_checks, competencies,
        error: `Rând ${r + 1}: kind=static dar nu există static_checks`,
      });
      continue;
    }

    problems.push({
      title, description, difficulty, xp_reward, hint, solution, is_premium,
      kind, test_cases, static_checks, competencies,
    });
  }

  return { problems, errors };
}

// ---------- export ----------

function csvEscape(s: string): string {
  if (s == null) return "";
  const needs = /["\n;]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needs ? `"${escaped}"` : escaped;
}

function escapeCell(s: string): string {
  return (s || "").replace(/\r/g, "").replace(/\n/g, "\\n");
}

export function generateProblemsExportCSV(
  problems: Array<{
    title: string;
    description: string;
    difficulty: string;
    xpReward: number;
    hint?: string;
    solution: string;
    isPremium: boolean;
    testCases: Array<{
      input?: string;
      expectedOutput?: string;
      hidden?: boolean;
      inputFiles?: Record<string, string>;
      expectedFiles?: Record<string, string>;
    }>;
    staticChecks?: Array<{ description: string; type: string; pattern: string; hidden?: boolean }>;
    kind?: ParsedKind;
    id?: string;
  }>,
  competenciesByItemId: Record<string, string[]> = {}
): string {
  const headers = [
    "title", "description", "difficulty", "xp_reward",
    "hint", "solution", "is_premium", "kind",
    "test_cases", "input_files", "expected_files", "static_checks",
    "competencies",
  ];

  const rows = problems.map((p) => {
    const tc = (p.testCases || [])
      .map((t) => `${escapeCell(t.input || "")}>>${escapeCell(t.expectedOutput || "")}>>${t.hidden ? 1 : 0}`)
      .join(";");
    const inF = serializeFilesCell((p.testCases || []).map((t) => t.inputFiles));
    const outF = serializeFilesCell((p.testCases || []).map((t) => t.expectedFiles));
    const sc = (p.staticChecks || [])
      .map((s) => `${escapeCell(s.description)}>>${s.type}>>${escapeCell(s.pattern)}>>${s.hidden ? 1 : 0}`)
      .join(";");
    const comps = (competenciesByItemId[p.id || ""] || []).join("|");
    return [
      csvEscape(p.title),
      csvEscape(escapeCell(p.description || "")),
      csvEscape(p.difficulty),
      String(p.xpReward ?? 10),
      csvEscape(escapeCell(p.hint || "")),
      csvEscape(escapeCell(p.solution || "")),
      p.isPremium ? "true" : "false",
      p.kind || "execute",
      csvEscape(tc),
      csvEscape(inF),
      csvEscape(outF),
      csvEscape(sc),
      csvEscape(comps),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export function getProblemsTemplateCSV(): string {
  const headers = [
    "title", "description", "difficulty", "xp_reward",
    "hint", "solution", "is_premium", "kind",
    "test_cases", "input_files", "expected_files", "static_checks",
    "competencies",
  ].join(",");

  const ex1 = [
    csvEscape("Suma a două numere"),
    csvEscape("Citește două numere și afișează **suma** lor."),
    "ușor", "10",
    csvEscape("Folosește operatorul +"),
    csvEscape("a = int(input())\nb = int(input())\nprint(a + b)"),
    "false", "execute",
    csvEscape("3\n5>>8>>0;10\n20>>30>>1"),
    "", "", "",
    csvEscape("CG.1|CS.2.1"),
  ].join(",");

  const ex2 = [
    csvEscape("Sumă din fișier"),
    csvEscape("Citește n și n numere din `date.in` și scrie suma în `date.out`."),
    "mediu", "20", "",
    csvEscape("with open('date.in') as f:\n    n = int(f.readline())\n    nums = list(map(int, f.readline().split()))\nwith open('date.out', 'w') as g:\n    g.write(str(sum(nums)))"),
    "false", "execute",
    "", // no stdin/stdout
    csvEscape("date.in|3\\n1 2 3@@date.in|5\\n10 20 30 40 50"),
    csvEscape("date.out|6@@date.out|150"),
    "", "",
  ].join(",");

  const ex3 = [
    csvEscape("Fereastră Tkinter cu buton"),
    csvEscape("Creează o fereastră Tkinter cu un Button cu textul `Click`."),
    "greu", "30", "",
    csvEscape("import tkinter as tk\nroot = tk.Tk()\nbtn = tk.Button(root, text='Click')\nbtn.pack()\nroot.mainloop()"),
    "false", "static",
    "", "", "",
    csvEscape("Importă tkinter>>import>>tkinter>>0;Creează fereastră Tk()>>call>>Tk>>0;Buton cu text 'Click'>>regex>>Button\\(.*text\\s*=\\s*['\\\"]Click['\\\"]>>0;Pornește mainloop()>>call>>mainloop>>0"),
    "",
  ].join(",");

  return [
    "# Format probleme — separator coloane = virgulă",
    "# kind: execute (default) sau static",
    "# test_cases: cazuri separate prin `;`, fiecare: input>>output>>hidden(0/1)",
    "# input_files / expected_files: cazuri separate prin `@@`, fișiere în caz prin `;;`, nume|conținut prin `|`",
    "# static_checks (doar kind=static): cazuri prin `;`, fiecare: descriere>>type>>pattern>>hidden(0/1) | type ∈ {import, call, regex}",
    "# Folosește \\n pentru linii noi în orice câmp text.",
    "# competencies: coduri CG/CS/M separate prin `|`",
    headers,
    ex1,
    ex2,
    ex3,
  ].join("\n");
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
