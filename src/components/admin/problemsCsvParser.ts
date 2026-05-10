// CSV parser dedicated to the `problems` table.
// Self-contained (does not depend on csvParser.ts) to keep semantics simple.

export interface ParsedProblem {
  title: string;
  description: string;
  difficulty: "ușor" | "mediu" | "greu";
  xp_reward: number;
  hint: string | null;
  solution: string;
  is_premium: boolean;
  test_cases: { input: string; expectedOutput: string; hidden: boolean }[];
  competencies: string[];
  error?: string;
}

const VALID_DIFFICULTIES = new Set(["ușor", "usor", "mediu", "greu"]);
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
      // Strip surrounding double quotes added by Excel/Sheets exports.
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
        title: "",
        description: "",
        difficulty: "ușor",
        xp_reward: 10,
        hint: null,
        solution: "",
        is_premium: false,
        test_cases: [],
        competencies: [],
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

    // test_cases: cases separated by ";", fields by ">>"
    // Each case: input>>expectedOutput>>hidden(0/1)
    const testCasesRaw = get("test_cases");
    const test_cases: { input: string; expectedOutput: string; hidden: boolean }[] = [];
    if (testCasesRaw.trim()) {
      const cases = testCasesRaw.split(";").map((c) => c.trim()).filter(Boolean);
      for (const c of cases) {
        const parts = c.split(">>");
        if (parts.length < 2) continue;
        test_cases.push({
          input: unescapeCell(parts[0]),
          expectedOutput: unescapeCell(parts[1]),
          hidden: (parts[2] || "0").trim() === "1",
        });
      }
    }

    // competencies: codes separated by "|"
    const compsRaw = get("competencies");
    const competencies = compsRaw
      ? compsRaw.split("|").map((c) => c.trim().toUpperCase()).filter(Boolean)
      : [];

    if (Number.isNaN(xp_reward)) {
      problems.push({
        title, description, difficulty, xp_reward: 10, hint, solution, is_premium,
        test_cases, competencies,
        error: `Rând ${r + 1}: xp_reward invalid`,
      });
      continue;
    }

    problems.push({
      title,
      description,
      difficulty,
      xp_reward,
      hint,
      solution,
      is_premium,
      test_cases,
      competencies,
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
  // Inverse of unescapeCell — convert real newlines to \n literal so the
  // value fits on one CSV line. We still wrap in quotes if needed.
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
    testCases: { input: string; expectedOutput: string; hidden?: boolean }[];
    id?: string;
  }>,
  competenciesByItemId: Record<string, string[]> = {}
): string {
  const headers = [
    "title", "description", "difficulty", "xp_reward",
    "hint", "solution", "is_premium", "test_cases", "competencies",
  ];

  const rows = problems.map((p) => {
    const tc = (p.testCases || [])
      .map((t) => `${escapeCell(t.input)}>>${escapeCell(t.expectedOutput)}>>${t.hidden ? 1 : 0}`)
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
      csvEscape(tc),
      csvEscape(comps),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export function getProblemsTemplateCSV(): string {
  const headers = [
    "title", "description", "difficulty", "xp_reward",
    "hint", "solution", "is_premium", "test_cases", "competencies",
  ].join(",");

  const ex1 = [
    csvEscape("Suma a două numere"),
    csvEscape("Citește două numere și afișează **suma** lor."),
    "ușor",
    "10",
    csvEscape("Folosește operatorul +"),
    csvEscape("a = int(input())\nb = int(input())\nprint(a + b)"),
    "false",
    csvEscape("3\n5>>8>>0;10\n20>>30>>1"),
    csvEscape("CG.1|CS.2.1"),
  ].join(",");

  const ex2 = [
    csvEscape("Pătratul unui număr"),
    csvEscape("Citește n și afișează n²."),
    "ușor",
    "10",
    "",
    csvEscape("n = int(input())\nprint(n * n)"),
    "false",
    csvEscape("4>>16>>0;7>>49>>1"),
    "",
  ].join(",");

  return [
    "# Format probleme: separator = virgulă",
    "# test_cases: cazuri separate prin `;`, fiecare caz: input>>output>>hidden(0/1)",
    "# Folosește \\n pentru linii noi în input/output/solution/description.",
    "# competencies: coduri CG/CS/M separate prin `|`",
    headers,
    ex1,
    ex2,
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
