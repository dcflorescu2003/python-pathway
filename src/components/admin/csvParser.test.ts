import { describe, it, expect } from "vitest";
import { convertSinglePipes, parseExercisesCSV, splitCompetencyCodes } from "./csvParser";

describe("splitCompetencyCodes", () => {
  it("splits a single string on any of ; , | or whitespace", () => {
    expect(splitCompetencyCodes("M61,M62")).toEqual(["M61", "M62"]);
    expect(splitCompetencyCodes("M61|M62;M63")).toEqual(["M61", "M62", "M63"]);
    expect(splitCompetencyCodes("M61 M62\tM63")).toEqual(["M61", "M62", "M63"]);
  });
  it("re-splits string[] elements that still contain separators", () => {
    expect(splitCompetencyCodes(["M61,M62", "M63"])).toEqual(["M61", "M62", "M63"]);
    expect(splitCompetencyCodes(["M61", "M62,M63"])).toEqual(["M61", "M62", "M63"]);
  });
  it("returns [] for null/undefined/empty", () => {
    expect(splitCompetencyCodes(null)).toEqual([]);
    expect(splitCompetencyCodes(undefined)).toEqual([]);
    expect(splitCompetencyCodes("")).toEqual([]);
    expect(splitCompetencyCodes([])).toEqual([]);
  });
});

describe("convertSinglePipes", () => {
  it("converts single pipe to comma", () => {
    expect(convertSinglePipes(">|>=")).toBe(">,>=");
    expect(convertSinglePipes("ana|mimi")).toBe("ana,mimi");
  });
  it("preserves double pipe (OR operator)", () => {
    expect(convertSinglePipes("x>0 || y>0")).toBe("x>0 || y>0");
  });
  it("handles mixed cases", () => {
    expect(convertSinglePipes("a||b|c")).toBe("a||b,c");
    expect(convertSinglePipes("a|b||c|d")).toBe("a,b||c,d");
  });
  it("returns input unchanged when no pipes", () => {
    expect(convertSinglePipes("hello")).toBe("hello");
  });
});

describe("parseExercisesCSV — pipe handling per column", () => {
  it("converts single pipes in option_* but preserves || in question", () => {
    const csv = [
      "type,question,option_a,option_b,option_c,option_d,correct,explanation",
      'quiz,"Care e corect: x>0 || y>0?",">|>=","<|<=",and,or,a,"ana|mimi"',
    ].join("\n");
    const { exercises, errors } = parseExercisesCSV(csv);
    expect(errors).toEqual([]);
    expect(exercises[0].question).toBe("Care e corect: x>0 || y>0?");
    expect(exercises[0].options?.[0].text).toBe(">,>=");
    expect(exercises[0].options?.[1].text).toBe("<,<=");
    expect(exercises[0].explanation).toBe("ana,mimi");
  });

  it("preserves | as separator in lines (order exercise)", () => {
    const csv = [
      "type,question,lines",
      'order,"Ordonează:","a|b|c"',
    ].join("\n");
    const { exercises } = parseExercisesCSV(csv);
    expect(exercises[0].lines?.length).toBe(3);
    expect(exercises[0].lines?.map(l => l.text)).toEqual(["a", "b", "c"]);
  });

  it("preserves | as separator in test_cases (problem exercise)", () => {
    const csv = [
      "type,question,solution,test_cases",
      'problem,"x","def f(): pass","1:2|3:4"',
    ].join("\n");
    const { exercises } = parseExercisesCSV(csv);
    expect(exercises[0].test_cases?.length).toBe(2);
  });
});

describe("parseExercisesCSV — competencies separators", () => {
  it("accepts ; , and | as competency separators without mangling codes", () => {
    const cases = [
      'quiz,"q","a","b",,,a,"e",,,,,,,,,"M91|M92|M93"',
      'quiz,"q","a","b",,,a,"e",,,,,,,,,"M91;M92;M93"',
      'quiz,"q","a","b",,,a,"e",,,,,,,,,"M91,M92,M93"',
    ];
    for (const row of cases) {
      const csv = [
        "type,question,option_a,option_b,option_c,option_d,correct,explanation,code_template,blanks,lines,statement,is_true,groups,solution,test_cases,competencies",
        row,
      ].join("\n");
      const { exercises } = parseExercisesCSV(csv);
      expect(exercises[0].competencies).toEqual(["M91", "M92", "M93"]);
    }
  });
});
