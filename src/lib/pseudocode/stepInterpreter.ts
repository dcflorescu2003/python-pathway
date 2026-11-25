import { interpretPseudocode, type ExecutionFrame } from "./interpreter";

export const MAX_SIMULATION_STEPS = 5000;
const MAX_TRACE_SIZE = 8_000_000;

export interface SimulationResult {
  frames: ExecutionFrame[];
  variableNames: string[];
  error?: string;
}

// Keep one source line per normalized line so the editor highlight stays accurate.
function normalizeLine(line: string): string {
  const parts = line.split(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g);
  return parts.map((part, index) => index % 2 ? part : part
    .replace(/\b(cat_timp|sfarsit_daca|sfarsit_cat_timp|sfarsit_pentru|pana_cand)\b/gi, word => word.replace(/_/g, " "))
    .replace(/sfârșit/gi, "sfarsit")
    .replace(/până\s+când/gi, "pana cand")
    .replace(/^(\s*[a-zA-Z_]\w*\s*)=(?!=)/, "$1<-")
    .replace(/\s+pas\s+(.+?)\s+execut[aă]/gi, ", $1 executa")
  ).join("");
}

export function simulatePseudocode(code: string, input: string): SimulationResult {
  const frames: ExecutionFrame[] = [];
  const names = new Set<string>();
  if (code.length > 20000 || input.length > 10000) {
    return { frames, variableNames: [], error: "Programul sau datele de intrare sunt prea lungi." };
  }
  const normalized = code.split("\n").map(normalizeLine).join("\n");
  for (const [index, raw] of normalized.split("\n").entries()) {
    const line = raw.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""').replace(/\/\/.*|#.*$/, "").trim();
    if (/\w\[/.test(line)) {
      return { frames, variableNames: [], error: `Linia ${index + 1}: Vectorii nu sunt incluși în această versiune.` };
    }
    const assignment = line.match(/^(?:pentru\s+)?([a-zA-Z_]\w*)\s*(?:<-|:=|←)/i);
    if (assignment) names.add(assignment[1]);
    const declarations = line.match(/^(?:citeste|citește|intreg|întreg|real|caracter|boolean|logic)\s+(.+)/i);
    if (declarations) for (const part of declarations[1].split(",")) {
      const name = part.trim().match(/^([a-zA-Z_]\w*)/);
      if (name) names.add(name[1]);
    }
  }
  if (names.size > 100) return { frames, variableNames: [], error: "Limita este de 100 de variabile." };
  let size = 0;
  const result = interpretPseudocode(normalized, input, {
    record(frame) {
      if (frames.length >= MAX_SIMULATION_STEPS) throw new Error("Simularea s-a oprit la limita de 5.000 de pași.");
      for (const name of Object.keys(frame.variables)) names.add(name);
      size += JSON.stringify(frame).length;
      if (size > MAX_TRACE_SIZE) throw new Error("Simularea s-a oprit: istoricul este prea mare.");
      frames.push(frame);
    },
  });
  return { frames, variableNames: [...names], error: result.error };
}