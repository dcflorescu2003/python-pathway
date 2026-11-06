import { describe, expect, it } from "vitest";
import { getClassLeaderboardName, getDefaultNickname, getPublicName, FUNNY_NICKNAMES } from "./leaderboardIdentity";

const student = {
  user_id: "12345678-abcd-4567-8901-123456789012",
  nickname: "CodeFox",
  display_name: "Ana Popescu",
};

describe("class leaderboard identity", () => {
  it("uses the nickname for classmates, never the roster name", () => {
    expect(getClassLeaderboardName(student, false)).toBe("CodeFox");
  });

  it("preserves the roster name for teachers", () => {
    expect(getClassLeaderboardName(student, true)).toBe("Ana Popescu");
  });

  it("provides a stable public alias when no nickname is saved", () => {
    const missing = { ...student, nickname: null };
    expect(getClassLeaderboardName(missing, false)).toBe(getDefaultNickname(student.user_id));
    expect(getClassLeaderboardName({ ...missing, display_name: "Alt nume" }, false))
      .toBe(getClassLeaderboardName(missing, false));
    expect(getClassLeaderboardName({ ...missing, user_id: "87654321-abcd-4567-8901-123456789012" }, false))
      .not.toBe(getClassLeaderboardName(missing, false));
  });

  it("treats whitespace nicknames as missing and uses a newly saved nickname", () => {
    expect(getClassLeaderboardName({ ...student, nickname: "  " }, false)).toBe(getDefaultNickname(student.user_id));
    expect(getClassLeaderboardName({ ...student, nickname: "  NewFox  " }, false)).toBe("NewFox");
  });

  it("has 15 funny defaults and never exposes the real name on public boards", () => {
    expect(FUNNY_NICKNAMES).toHaveLength(15);
    const alias = getPublicName({ user_id: student.user_id, nickname: null });
    expect(FUNNY_NICKNAMES.some((n) => alias.startsWith(n))).toBe(true);
    expect(alias).not.toContain("Ana");
  });
});
