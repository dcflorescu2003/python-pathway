import { describe, it, expect } from "vitest";
import { groupChallenges } from "./challengeGroups";

describe("groupChallenges", () => {
  it("puts items assigned together into one challenge", () => {
    const rows = [
      { id: "1", group_id: "g", group_title: "Tema 1", created_at: "2026-11-09T07:00:00Z", due_date: null },
      { id: "2", group_id: "g", group_title: "Tema 1", created_at: "2026-11-09T07:00:00Z", due_date: null },
      { id: "3", group_id: "h", group_title: null, created_at: "2026-11-10T07:00:00Z", due_date: null },
    ];
    const groups = groupChallenges(rows);
    expect(groups).toHaveLength(2);
    expect(groups[0].key).toBe("h");
    expect(groups[1].items).toHaveLength(2);
    expect(groups[1].title).toBe("Tema 1");
  });
  it("treats rows without a group as their own challenge", () => {
    const groups = groupChallenges([
      { id: "a", created_at: "2026-11-09T07:00:00Z", due_date: null },
      { id: "b", created_at: "2026-11-09T07:00:00Z", due_date: null },
    ]);
    expect(groups).toHaveLength(2);
  });
  it("keeps items in the order the teacher selected them", () => {
    const groups = groupChallenges([
      { id: "x", group_id: "g", sort_order: 2, created_at: "2026-11-09T07:00:00Z", due_date: null },
      { id: "y", group_id: "g", sort_order: 0, created_at: "2026-11-09T07:00:00Z", due_date: null },
      { id: "z", group_id: "g", sort_order: 1, created_at: "2026-11-09T07:00:00Z", due_date: null },
    ]);
    expect(groups[0].items.map((i) => i.id)).toEqual(["y", "z", "x"]);
  });
});
