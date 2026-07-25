import { describe, expect, it } from "vitest";
import { formatLines } from "../src/app/repositories/[id]/symbols/SymbolsClient";

describe("Symbols page data mapping — formatLines", () => {
  it("returns the line number as-is when startLine equals endLine", () => {
    expect(formatLines(1, 1)).toBe("1");
    expect(formatLines(42, 42)).toBe("42");
    expect(formatLines(120, 120)).toBe("120");
  });

  it("returns an en-dash range when startLine and endLine differ", () => {
    expect(formatLines(1, 3)).toBe("1–3");
    expect(formatLines(4, 8)).toBe("4–8");
    expect(formatLines(12, 24)).toBe("12–24");
  });
});
