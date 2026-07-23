import { describe, it, expect } from "vitest";
import { computeChunkRanges, sliceChunkText } from "../src/server/services/embeddingChunker";

describe("computeChunkRanges", () => {
  it("returns fixed-window chunks for a file with zero qualifying symbols", () => {
    const content = "line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10\nline11\nline12\nline13\nline14\nline15\nline16\nline17\nline18\nline19\nline20\nline21\nline22\nline23\nline24\nline25\nline26\nline27\nline28\nline29\nline30\nline31\nline32";
    const ranges = computeChunkRanges(content, []);
    expect(ranges.length).toBeGreaterThan(1);
    expect(ranges[0].startLine).toBe(1);
    expect(ranges[ranges.length - 1].endLine).toBe(32);
    expect(ranges[0].endLine - ranges[0].startLine + 1).toBeLessThanOrEqual(30);
  });

  it("preserves symbol chunks and fills gaps with fixed windows", () => {
    const content = Array.from({ length: 80 }, (_, i) => `line${i + 1}`).join("\n");
    const symbols = [
      { kind: "function", startLine: 10, endLine: 25 },
      { kind: "class", startLine: 40, endLine: 55 },
      { kind: "import", startLine: 5, endLine: 5 }
    ];

    const ranges = computeChunkRanges(content, symbols);

    const hasSymbol1 = ranges.some((r) => r.startLine === 10 && r.endLine === 25);
    const hasSymbol2 = ranges.some((r) => r.startLine === 40 && r.endLine === 55);
    expect(hasSymbol1).toBe(true);
    expect(hasSymbol2).toBe(true);

    const gapBeforeFirst = ranges.filter((r) => r.startLine >= 1 && r.endLine < 10);
    expect(gapBeforeFirst.length).toBeGreaterThan(0);

    const gapBetween = ranges.filter((r) => r.startLine > 25 && r.endLine < 40);
    expect(gapBetween.length).toBeGreaterThan(0);

    const gapAfterLast = ranges.filter((r) => r.startLine > 55 && r.endLine <= 80);
    expect(gapAfterLast.length).toBeGreaterThan(0);
  });

  it("returns empty array for empty file content with no symbols", () => {
    const ranges = computeChunkRanges("", []);
    expect(ranges).toEqual([]);
  });

  it("ignores non-qualifying symbol kinds", () => {
    const content = Array.from({ length: 10 }, (_, i) => `line${i + 1}`).join("\n");
    const symbols = [
      { kind: "import", startLine: 2, endLine: 2 },
      { kind: "export", startLine: 5, endLine: 5 }
    ];

    const ranges = computeChunkRanges(content, symbols);
    expect(ranges.length).toBeGreaterThan(0);
    expect(ranges.every((r) => r.startLine >= 1 && r.endLine <= 30 || false)).toBe(true);
  });

  it("does not create overlapping chunk windows in gaps", () => {
    const content = Array.from({ length: 60 }, (_, i) => `line${i + 1}`).join("\n");
    const symbols = [{ kind: "function", startLine: 20, endLine: 25 }];

    const ranges = computeChunkRanges(content, symbols);
    for (let i = 0; i < ranges.length - 1; i++) {
      expect(ranges[i + 1].startLine).toBeGreaterThan(ranges[i].endLine);
    }
  });
});

describe("sliceChunkText", () => {
  it("extracts the correct line range from content", () => {
    const content = "line1\nline2\nline3\nline4\nline5";
    expect(sliceChunkText(content, 2, 4)).toBe("line2\nline3\nline4");
  });

  it("returns empty string when startLine is out of bounds", () => {
    const content = "line1\nline2";
    expect(sliceChunkText(content, 5, 6)).toBe("");
  });
});
