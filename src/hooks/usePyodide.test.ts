import { describe, expect, it } from "vitest";
import { formatStudentPythonError } from "./usePyodide";

describe("formatStudentPythonError", () => {
  it("keeps only the student line and final NameError", () => {
    const error = new Error(`Traceback (most recent call last):
  File "./lib/python3.11/site-packages/_pyodide/_base.py", line 501, in eval_code
  File "<exec>", line 1, in <module>
  File "main.py", line 3, in <module>
NameError: name 'dd' is not defined`);

    expect(formatStudentPythonError(error)).toBe("Linia 3: NameError: name 'dd' is not defined");
  });

  it("reports a syntax error against main.py", () => {
    const error = new Error(`PythonError: Traceback (most recent call last):
  File "./lib/python3.11/site-packages/_pyodide/_base.py", line 339, in run
  File "main.py", line 2
    print(
         ^
SyntaxError: '(' was never closed`);

    expect(formatStudentPythonError(error)).toBe("Linia 2: SyntaxError: '(' was never closed");
  });

  it("uses the deepest student frame for errors inside functions", () => {
    const error = new Error(`Traceback (most recent call last):
  File "main.py", line 5, in <module>
  File "main.py", line 2, in calculate
ZeroDivisionError: division by zero`);

    expect(formatStudentPythonError(error)).toBe("Linia 2: ZeroDivisionError: division by zero");
  });

  it("preserves the friendly timeout message", () => {
    expect(formatStudentPythonError(new Error("Timeout: codul a depășit 10 secunde"))).toBe(
      "Timeout: codul a depășit 10 secunde",
    );
  });

  it("does not expose an unrecognized internal error", () => {
    const result = formatStudentPythonError(new Error("internal pyodide bridge failed at /lib/python3.11"));

    expect(result).toBe("Eroare la rularea codului. Verifică instrucțiunile și încearcă din nou.");
    expect(result).not.toMatch(/pyodide|python3|\/lib/i);
  });
});