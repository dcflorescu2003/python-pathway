import { describe, it, expect } from "vitest";
import { normalizeExternalUrl } from "./normalizeUrl";

describe("normalizeExternalUrl", () => {
  it("keeps absolute https urls", () => {
    expect(normalizeExternalUrl("https://liccuza.ro/")).toBe("https://liccuza.ro/");
  });

  it("adds https to schemeless domains", () => {
    expect(normalizeExternalUrl("www.liccuza.ro")).toBe("https://www.liccuza.ro/");
    expect(normalizeExternalUrl("ltmcis.ro/files/orar.pdf")).toBe("https://ltmcis.ro/files/orar.pdf");
  });

  it("rejects free text", () => {
    expect(normalizeExternalUrl("Colega de catedra :) love!")).toBeNull();
    expect(normalizeExternalUrl("profesor")).toBeNull();
    expect(normalizeExternalUrl("")).toBeNull();
    expect(normalizeExternalUrl(null)).toBeNull();
  });

  it("rejects non-http schemes", () => {
    expect(normalizeExternalUrl("mailto:a@b.ro")).toBeNull();
    expect(normalizeExternalUrl("javascript:alert(1)")).toBeNull();
  });
});
