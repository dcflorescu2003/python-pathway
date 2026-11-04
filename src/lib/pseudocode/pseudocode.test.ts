import { describe, it, expect } from "vitest";
import { interpretPseudocode } from "./interpreter";
import { checkAgainstSolution } from "./check";
import { pseudoProblems } from "@/data/pseudocodeProblems";
import { pseudoLessons } from "@/data/pseudocodeLessons";

describe("probleme publice de pseudocod", () => {
  it("are exact 30 de probleme cu slug unic", () => {
    expect(pseudoProblems).toHaveLength(30);
    expect(new Set(pseudoProblems.map((p) => p.slug)).size).toBe(30);
  });

  it.each(pseudoProblems.map((p) => [p.slug, p] as const))("soluția pentru %s rulează fără erori", (_s, p) => {
    for (const input of p.tests) {
      const r = interpretPseudocode(p.solution, input);
      expect(r.error).toBeUndefined();
      expect(r.output.trim().length).toBeGreaterThan(0);
    }
  });

  it("valorile cunoscute sunt corecte", () => {
    const run = (slug: string, input: string) =>
      interpretPseudocode(pseudoProblems.find((p) => p.slug === slug)!.solution, input).output.trim();
    expect(run("suma-a-doua-numere", "3\n5")).toBe("8");
    expect(run("an-bisect", "1900")).toBe("NU");
    expect(run("numarul-de-cifre", "0")).toBe("1");
    expect(run("cmmdc-algoritmul-lui-euclid", "48\n18")).toBe("6");
    expect(run("numar-prim", "97")).toBe("DA");
    expect(run("sirul-lui-fibonacci", "7")).toBe("13");
    expect(run("ordonarea-crescatoare-a-trei-numere", "9\n2\n5")).toBe("2 5 9");
  });

  it("un program greșit nu trece verificarea", () => {
    const p = pseudoProblems.find((x) => x.slug === "suma-a-doua-numere")!;
    expect(checkAgainstSolution("citeste a, b\nscrie a - b", p.solution, p.tests).passed).toBeLessThan(p.tests.length);
    expect(checkAgainstSolution(p.solution, p.solution, p.tests).passed).toBe(p.tests.length);
  });

  it("exemplele lecțiilor de algoritmi elementari dau rezultatele corecte", () => {
    const out = (slug: string, idx: number) => {
      const s = pseudoLessons.find((l) => l.slug === slug)!.sections[idx];
      return interpretPseudocode(s.code!, s.input ?? "").output.trim();
    };
    expect(out("numarul-de-cifre-si-suma-cifrelor", 1)).toBe("3");
    expect(out("numarul-de-cifre-si-suma-cifrelor", 2)).toBe("10");
    expect(out("oglinditul-unui-numar-si-palindrom", 0)).toBe("4321");
    expect(out("oglinditul-unui-numar-si-palindrom", 1)).toBe("DA");
    expect(out("numar-prim-si-numar-perfect", 0)).toBe("DA");
    expect(out("numar-prim-si-numar-perfect", 1)).toBe("DA");
    expect(out("cmmdc-si-cmmmc", 0)).toBe("6");
    expect(out("cmmdc-si-cmmmc", 1)).toBe("6");
    expect(out("cmmdc-si-cmmmc", 2).replace(/\s+/g, " ")).toBe("cmmdc = 2 cmmmc = 12");
  });

  it("exemplele din lecții rulează", () => {
    for (const l of pseudoLessons) for (const s of l.sections) if (s.code) {
      expect(interpretPseudocode(s.code, s.input ?? "").error).toBeUndefined();
    }
  });
});
