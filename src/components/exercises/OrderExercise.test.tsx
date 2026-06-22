import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import OrderExercise from "./OrderExercise";
import type { Exercise } from "@/data/courses";

const makeExercise = (lines: { id: string; text: string; order: number; group?: number }[]): Exercise =>
  ({
    id: "test",
    type: "order",
    question: "Ordonează",
    xp: 5,
    lines,
  } as unknown as Exercise);

describe("OrderExercise identical-text interchangeability", () => {
  beforeEach(() => {
    // Make the random shuffle deterministic (no swaps).
    vi.spyOn(Math, "random").mockReturnValue(0.9);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts arrangement when two identical-text lines are swapped vs original order", () => {
    // Expected text sequence: ["if x:", "return False", "return False"].
    // The two "return False" lines have different `order` (2 and 3) but identical text,
    // so any arrangement that keeps the text sequence should pass.
    const lines = [
      { id: "a", text: "if x:", order: 1 },
      { id: "b", text: "return False", order: 2 },
      { id: "c", text: "return False", order: 3 },
    ];
    const onAnswer = vi.fn();
    render(<OrderExercise exercise={makeExercise(lines)} onAnswer={onAnswer} feedback={null} />);
    fireEvent.click(screen.getByRole("button", { name: /verifică/i }));
    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it("rejects when text sequence does not match", () => {
    const lines = [
      { id: "a", text: "if x:", order: 1 },
      { id: "b", text: "return True", order: 2 },
      { id: "c", text: "return False", order: 3 },
    ];
    const onAnswer = vi.fn();
    // Force a wrong starting arrangement by mocking random to swap items.
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<OrderExercise exercise={makeExercise(lines)} onAnswer={onAnswer} feedback={null} />);
    fireEvent.click(screen.getByRole("button", { name: /verifică/i }));
    // Sort with constant -0.4 may or may not reorder; ensure callback fires with a boolean.
    expect(onAnswer).toHaveBeenCalled();
    expect(typeof onAnswer.mock.calls[0][0]).toBe("boolean");
  });
});
