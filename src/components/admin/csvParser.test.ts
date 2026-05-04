import { describe, it, expect } from "vitest";
import { convertSinglePipes, parseExercisesCSV } from "./csvParser";

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
