import { describe, expect, it } from "vitest";
import { simulatePseudocode, MAX_SIMULATION_STEPS } from "./stepInterpreter";
import { interpretPseudocode } from "./interpreter";
import { simulatorExamples } from "@/data/pseudocodeSimulatorExamples";

describe("simulator de pseudocod", () => {
  it("înregistrează fiecare instrucțiune, intrarea și ieșirea fără a modifica pașii anteriori", () => {
    const result = simulatePseudocode('citeste a, b\ns <- a + b\ns <- s * 2\nscrie s', '3\n5');
    expect(result.error).toBeUndefined();
    expect(result.variableNames).toEqual(['a', 'b', 's']);
    expect(result.frames.map(frame => frame.line)).toEqual([1, 2, 3, 4]);
    expect(result.frames[0]).toMatchObject({ variables: { a: 3, b: 5 }, inputConsumed: 2, output: '' });
    expect(result.frames[1]?.variables.s).toBe(8);
    expect(result.frames[2]?.variables.s).toBe(16);
    expect(result.frames[3]?.output).toBe('16');
  });
  it("păstrează liniile originale inclusiv comentariile și liniile goale", () => {
    const result = simulatePseudocode('// comentariu\n\na <- 1\n\nscrie a', '');
    expect(result.frames.map(frame => frame.line)).toEqual([3, 5]);
  });
  it("înregistrează condițiile și ramurile din bucle imbricate", () => {
    const result = simulatePseudocode('n <- 2\ncat timp n > 0 executa\n  daca n = 2 atunci\n    scrie "doi"\n  altfel\n    scrie "unu"\n  sfarsit daca\n  n <- n - 1\nsfarsit cat timp', '');
    expect(result.error).toBeUndefined();
    expect(result.frames.filter(frame => frame.line === 2).map(frame => frame.condition)).toEqual([true, true, false]);
    expect(result.frames.filter(frame => frame.line === 3).map(frame => frame.condition)).toEqual([true, false]);
    expect(result.frames.at(-1)?.output).toBe('doi\nunu');
  });
  it("rulează repeta până la condiția adevărată și normalizează sintaxa", () => {
    const result = simulatePseudocode('n = 0\nrepeta\n n := n + 1\npana_cand n = 3\nscrie n', '');
    expect(result.error).toBeUndefined();
    expect(result.frames.filter(frame => frame.line === 4).map(frame => frame.condition)).toEqual([false, false, true]);
    expect(result.frames.at(-1)?.output).toBe('3');
  });
  it("acceptă pas negativ pentru pentru și partea întreagă fără vectori", () => {
    const result = simulatePseudocode('s <- 0\npentru i <- 3, 1 pas -1 executa\n s <- s + i\nsfarsit_pentru\nscrie [s / 2]', '');
    expect(result.error).toBeUndefined();
    expect(result.frames.filter(frame => frame.line === 3).map(frame => frame.variables.s)).toEqual([3, 5, 6]);
    expect(result.frames.at(-1)?.output).toBe('3');
  });
  it("nu include vectori în prima versiune", () => {
    const result = simulatePseudocode('v[1] <- 2', '');
    expect(result.error).toBeDefined();
    expect(result.frames).toHaveLength(0);
  });
  it("oprește simularea la 5000 de pași, inclusiv buclele cu corp gol", () => {
    const result = simulatePseudocode('cat timp adevarat executa\nsfarsit cat timp', '');
    expect(result.error).toBeDefined();
    expect(result.frames).toHaveLength(MAX_SIMULATION_STEPS);
    expect(MAX_SIMULATION_STEPS).toBe(5000);
  });
  it("păstrează progresul valid înainte de o intrare lipsă", () => {
    const result = simulatePseudocode('citeste a\nscrie a\nciteste b', '7');
    expect(result.error).toBeDefined();
    expect(result.frames).toHaveLength(2);
    expect(result.frames.at(-1)).toMatchObject({ output: '7', variables: { a: 7 }, inputConsumed: 1 });
  });
  it("respinge variabile neinițializate și expresii JavaScript", () => {
    expect(simulatePseudocode('a <- b + 1', '').error).toBeDefined();
    expect(simulatePseudocode('a <- globalThis.location', '').error).toBeDefined();
    expect(simulatePseudocode('a <- 1 / 0', '').error).toBeDefined();
    expect(simulatePseudocode('cat timp adevarat executa\na <- 1', '').error).toBeDefined();
  });
  it.each(simulatorExamples)('exemplul $title corespunde execuției normale', example => {
    const result = simulatePseudocode(example.code, example.input);
    expect(result.error).toBeUndefined();
    expect(result.frames.at(-1)?.output).toBe(interpretPseudocode(example.code, example.input).output);
  });
});