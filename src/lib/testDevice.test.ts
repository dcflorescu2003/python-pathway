import { describe, it, expect } from "vitest";
import { describeDevice } from "./testDevice";

describe("describeDevice", () => {
  it("labels a Windows Chrome browser", () => {
    expect(describeDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36", false, "web")).toBe("Windows · Chrome");
  });
  it("labels the native Android app", () => {
    expect(describeDevice("anything", true, "android")).toBe("Android · Aplicație");
  });
});
