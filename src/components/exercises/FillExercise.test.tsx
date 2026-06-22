import { describe, it, expect } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import FillExercise from "./FillExercise";
import type { Exercise } from "@/data/courses";

const makeExercise = (answer: string): Exercise =>
  ({
    id: "test",
    type: "fill",
    question: "Q",
    xp: 5,
    codeTemplate: "if x ___ 5:",
    blanks: [{ id: "b1", answer }],
  } as Exercise);

const submit = (input: string, answer: string): boolean => {
  let result: boolean | null = null;
  render(
    <FillExercise
      exercise={makeExercise(answer)}
      onAnswer={(c) => {
        result = c;
      }}
      feedback={null}
    />
  );
  const inputEl = screen.getByPlaceholderText(/_+/);
  fireEvent.change(inputEl, { target: { value: input } });
  fireEvent.click(screen.getByRole("button", { name: /verifică/i }));
  return result!;
};

describe("FillExercise blank validation", () => {
  it("accepts first alternative with pipe + spaces", () => {
    expect(submit(">", "> | >=")).toBe(true);
  });
  it("accepts second alternative without spaces", () => {
    expect(submit(">=", ">|>=")).toBe(true);
  });
  it("rejects wrong answer", () => {
    expect(submit("<", "> | >=")).toBe(false);
  });
  it("normalizes case and trailing spaces", () => {
    expect(submit("INT ", "int")).toBe(true);
  });
  it("handles NBSP separators", () => {
    expect(submit(">", ">\u00A0|\u00A0>=")).toBe(true);
  });
  it("supports comma separator", () => {
    expect(submit("==", "==,!=")).toBe(true);
  });
  it("accepts answer without spaces when canonical has spaces", () => {
    expect(submit("s+d", "s + d")).toBe(true);
  });
  it("accepts multi-operator expression without spaces", () => {
    expect(submit("n%d==0", "n % d == 0")).toBe(true);
  });
  it("accepts range(2,n) when canonical has both variants with paren-comma", () => {
    expect(submit("range(2,n)", "range(2, n), range(2,n)")).toBe(true);
  });
  it("accepts range(2, n) when canonical has both variants with paren-comma", () => {
    expect(submit("range(2, n)", "range(2, n), range(2,n)")).toBe(true);
  });
});
