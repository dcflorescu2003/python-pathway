import { useState, useRef, useCallback } from "react";

declare global {
  interface Window {
    loadPyodide: (config: { indexURL: string }) => Promise<any>;
  }
}

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/";
const TIMEOUT_MS = 10_000;

export interface FileResult {
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
  missing?: boolean;
}

export interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error?: string;
  hidden?: boolean;
  fileResults?: FileResult[];
}

export interface TestCaseLike {
  input?: string;
  expectedOutput?: string;
  inputFiles?: Record<string, string>;
  expectedFiles?: Record<string, string>;
  hidden?: boolean;
}

export interface StaticCheck {
  description: string;
  type: "import" | "call" | "regex";
  pattern: string;
  hidden?: boolean;
}

export interface StaticCheckResult {
  description: string;
  passed: boolean;
  hidden?: boolean;
}

const normalize = (s: string) => (s ?? "").replace(/\r\n/g, "\n").replace(/\s+$/g, "");

const FALLBACK_EXECUTION_ERROR = "Eroare la rularea codului. Verifică instrucțiunile și încearcă din nou.";

/**
 * Keep only diagnostics that point to the student's virtual main.py file.
 * Pyodide prefixes Python exceptions with its own JavaScript/Python frames;
 * those implementation details are noisy and should never reach students.
 */
export function formatStudentPythonError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (!raw.trim()) return FALLBACK_EXECUTION_ERROR;
  if (raw.includes("Timeout: codul a depășit 10 secunde")) {
    return "Timeout: codul a depășit 10 secunde";
  }

  const normalized = raw.replace(/\r\n/g, "\n");
  const studentFrames = [...normalized.matchAll(/File ["']main\.py["'], line (\d+)/g)];
  const lineNumber = studentFrames.at(-1)?.[1];

  const exceptionLines = normalized
    .split("\n")
    .map((line) => line.trim().replace(/^PythonError:\s*/, ""))
    .filter(Boolean);
  const exception = [...exceptionLines]
    .reverse()
    .find((line) => /^[A-Za-z_][\w.]*(?:Error|Exception|Interrupt):(?:\s|$)/.test(line));

  if (!exception) return FALLBACK_EXECUTION_ERROR;

  const safeException = exception
    .replace(/(?:\.?\.?\/|\/)[^\s:"']*(?:pyodide|python\d*\.\d*)[^\s:"']*/gi, "motorul Python")
    .trim();
  if (!safeException) return FALLBACK_EXECUTION_ERROR;

  return lineNumber ? `Linia ${lineNumber}: ${safeException}` : safeException;
}

export function usePyodide() {
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const pyodideRef = useRef<any>(null);

  const ensureLoaded = useCallback(async () => {
    if (pyodideRef.current) return pyodideRef.current;

    setLoading(true);
    try {
      if (!window.loadPyodide) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = `${PYODIDE_CDN}pyodide.js`;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Nu s-a putut încărca Pyodide"));
          document.head.appendChild(script);
        });
      }

      const pyodide = await window.loadPyodide({ indexURL: PYODIDE_CDN });
      pyodideRef.current = pyodide;
      return pyodide;
    } finally {
      setLoading(false);
    }
  }, []);

  const runCode = useCallback(
    async (code: string, testCases: TestCaseLike[]): Promise<TestResult[]> => {
      setRunning(true);
      try {
        const pyodide = await ensureLoaded();
        const results: TestResult[] = [];

        for (const tc of testCases) {
          const inputFiles = tc.inputFiles || {};
          const expectedFiles = tc.expectedFiles || {};
          const allFileNames = new Set([...Object.keys(inputFiles), ...Object.keys(expectedFiles)]);

          // Cleanup any leftover files from previous tests
          for (const name of allFileNames) {
            try { pyodide.FS.unlink(name); } catch { /* not present */ }
          }
          // Write input files
          for (const [name, content] of Object.entries(inputFiles)) {
            pyodide.FS.writeFile(name, content);
          }

          try {
            const result = await Promise.race([
              (async () => {
                const inputLines = (tc.input ?? "").split("\n");
                pyodide.runPython(`
import sys
from io import StringIO

_input_lines = ${JSON.stringify(inputLines)}
_input_idx = 0
_stdout_capture = StringIO()

def _mock_input(prompt=""):
    global _input_idx
    if _input_idx < len(_input_lines):
        val = _input_lines[_input_idx]
        _input_idx += 1
        return val
    return ""

__builtins__.input = _mock_input
sys.stdout = _stdout_capture
`);

                // Give student code its own virtual filename so traceback line
                // numbers map exactly to the editor instead of Pyodide's <exec>.
                pyodide.globals.set("_student_code", code);
                pyodide.runPython('exec(compile(_student_code, "main.py", "exec"), {"__name__": "__main__"})');

                const output = pyodide.runPython("_stdout_capture.getvalue()").trim();
                pyodide.runPython("sys.stdout = sys.__stdout__");

                // Read expected output files
                const fileResults: FileResult[] = [];
                for (const [name, expected] of Object.entries(expectedFiles)) {
                  let actual = "";
                  let missing = false;
                  try {
                    actual = pyodide.FS.readFile(name, { encoding: "utf8" }) as string;
                  } catch {
                    missing = true;
                  }
                  const passed = !missing && normalize(actual) === normalize(expected);
                  fileResults.push({ name, expected, actual, passed, missing });
                }

                const stdoutMatch =
                  tc.expectedOutput === undefined
                    ? true
                    : normalize(output) === normalize(tc.expectedOutput);
                const filesMatch = fileResults.every((f) => f.passed);

                return {
                  input: tc.input ?? "",
                  expectedOutput: tc.expectedOutput ?? "",
                  actualOutput: output,
                  passed: stdoutMatch && filesMatch,
                  hidden: tc.hidden,
                  fileResults: fileResults.length > 0 ? fileResults : undefined,
                };
              })(),
              new Promise<TestResult>((_, reject) =>
                setTimeout(() => reject(new Error("Timeout: codul a depășit 10 secunde")), TIMEOUT_MS)
              ),
            ]);
            results.push(result);
          } catch (err: any) {
            try {
              pyodide.runPython("import sys; sys.stdout = sys.__stdout__");
            } catch {}
            results.push({
              input: tc.input ?? "",
              expectedOutput: tc.expectedOutput ?? "",
              actualOutput: "",
              passed: false,
               error: formatStudentPythonError(err),
              hidden: tc.hidden,
            });
          } finally {
            // Cleanup files between tests
            for (const name of allFileNames) {
              try { pyodide.FS.unlink(name); } catch { /* ignore */ }
            }
          }
        }

        return results;
      } finally {
        setRunning(false);
      }
    },
    [ensureLoaded]
  );

  // Static analysis: no execution. Used for Tkinter etc.
  const runStaticChecks = useCallback((code: string, checks: StaticCheck[]): StaticCheckResult[] => {
    return checks.map((c) => {
      let passed = false;
      try {
        if (c.type === "import") {
          // Match `import X`, `import X as Y`, `from X import ...`, including dotted modules
          const escaped = c.pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const re = new RegExp(
            `(^|\\n)\\s*(import\\s+${escaped}(\\s|,|$|\\.)|from\\s+${escaped}(\\s|\\.))`,
            "m"
          );
          passed = re.test(code);
        } else if (c.type === "call") {
          // Match `NAME(` or `.NAME(` (attribute call). pattern is the bare identifier.
          const escaped = c.pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const re = new RegExp(`(^|[^a-zA-Z0-9_])${escaped}\\s*\\(`, "m");
          passed = re.test(code);
        } else if (c.type === "regex") {
          const re = new RegExp(c.pattern, "m");
          passed = re.test(code);
        }
      } catch {
        passed = false;
      }
      return { description: c.description, passed, hidden: c.hidden };
    });
  }, []);

  return { loading, running, runCode, runStaticChecks };
}
