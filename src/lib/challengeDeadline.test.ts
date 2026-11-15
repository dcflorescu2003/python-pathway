import { describe, it, expect } from "vitest";
import { isChallengeExpired, isCompletedLate } from "./challengeDeadline";

describe("isChallengeExpired", () => {
  it("is still active during the whole due day in Romania", () => {
    // 8 Nov 2026 23:30 Bucharest = 21:30 UTC
    expect(isChallengeExpired("2026-11-08", new Date("2026-11-08T21:30:00Z"))).toBe(false);
  });
  it("expires right after the due day ends in Romania", () => {
    // 9 Nov 2026 00:10 Bucharest = 8 Nov 22:10 UTC
    expect(isChallengeExpired("2026-11-08", new Date("2026-11-08T22:10:00Z"))).toBe(true);
  });
  it("never expires without a due date", () => {
    expect(isChallengeExpired(null, new Date("2030-01-01T00:00:00Z"))).toBe(false);
  });
});

describe("isCompletedLate", () => {
  it("is on time until the end of the due day in Romania", () => {
    expect(isCompletedLate("2026-11-10", "2026-11-10T21:30:00Z")).toBe(false);
  });
  it("is late after midnight Romania time", () => {
    expect(isCompletedLate("2026-11-10", "2026-11-10T22:30:00Z")).toBe(true);
  });
  it("is never late without a due date", () => {
    expect(isCompletedLate(null, "2030-01-01T00:00:00Z")).toBe(false);
  });
});
