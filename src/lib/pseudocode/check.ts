import { interpretPseudocode } from "./interpreter";

export const normalizeOutput = (s: string) =>
  s
    .split("\n")
    .map((l) => l.trim().replace(/\s+/g, " "))
    .filter((l) => l.length > 0)
    .join("\n");

export interface CheckResult {
  passed: number;
  total: number;
  firstFail?: { input: string; expected: string; got: string };
}

/** Compară programul elevului cu soluția oficială pe toate intrările de test. */
export function checkAgainstSolution(code: string, solution: string, tests: string[]): CheckResult {
  let passed = 0;
  let firstFail: CheckResult["firstFail"];
  for (const input of tests) {
    const expected = normalizeOutput(interpretPseudocode(solution, input).output);
    const res = interpretPseudocode(code, input);
    const got = normalizeOutput(res.error ? `${res.output}\nEroare: ${res.error}` : res.output);
    if (!res.error && got === expected) passed++;
    else if (!firstFail) firstFail = { input, expected, got };
  }
  return { passed, total: tests.length, firstFail };
}
