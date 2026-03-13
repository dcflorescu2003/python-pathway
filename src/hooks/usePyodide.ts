import { useState, useRef, useCallback } from "react";

declare global {
  interface Window {
    loadPyodide: (config: { indexURL: string }) => Promise<any>;
  }
}

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/";
const TIMEOUT_MS = 10_000;

export interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error?: string;
  hidden?: boolean;
}

export function usePyodide() {
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const pyodideRef = useRef<any>(null);

  const ensureLoaded = useCallback(async () => {
    if (pyodideRef.current) return pyodideRef.current;

    setLoading(true);
    try {
      // Load script if not present
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
    async (
      code: string,
      testCases: { input: string; expectedOutput: string; hidden?: boolean }[]
    ): Promise<TestResult[]> => {
      setRunning(true);
      try {
        const pyodide = await ensureLoaded();
        const results: TestResult[] = [];

        for (const tc of testCases) {
          try {
            const result = await Promise.race([
              (async () => {
                // Set up input simulation and stdout capture
                const inputLines = tc.input.split("\n");
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

                pyodide.runPython(code);

                const output = pyodide
                  .runPython("_stdout_capture.getvalue()")
                  .trim();

                // Reset stdout
                pyodide.runPython("sys.stdout = sys.__stdout__");

                return {
                  input: tc.input,
                  expectedOutput: tc.expectedOutput,
                  actualOutput: output,
                  passed: output === tc.expectedOutput,
                  hidden: tc.hidden,
                };
              })(),
              new Promise<TestResult>((_, reject) =>
                setTimeout(() => reject(new Error("Timeout: codul a depășit 10 secunde")), TIMEOUT_MS)
              ),
            ]);
            results.push(result);
          } catch (err: any) {
            // Reset stdout on error
            try {
              pyodide.runPython("import sys; sys.stdout = sys.__stdout__");
            } catch {}

            results.push({
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              actualOutput: "",
              passed: false,
              error: err.message || "Eroare necunoscută",
              hidden: tc.hidden,
            });
          }
        }

        return results;
      } finally {
        setRunning(false);
      }
    },
    [ensureLoaded]
  );

  return { loading, running, runCode };
}
