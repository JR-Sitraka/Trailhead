import { describe, expect, it } from "vitest";
import { parseInlineCitations, ChatCitation } from "../src/server/services/chat";

const makeCitation = (label: number, fileId: string = `f${label}`): ChatCitation => ({
  fileId,
  path: `src/file${label}.ts`,
  startLine: label * 10,
  endLine: label * 10 + 5,
  label,
});

describe("parseInlineCitations", () => {
  it("returns a single text segment when no brackets are present", () => {
    const result = parseInlineCitations("Hello world", new Map());
    expect(result).toEqual([{ type: "text", content: "Hello world" }]);
  });

  it("parses inline citations correctly", () => {
    const map = new Map<number, ChatCitation>([
      [1, makeCitation(1)],
      [2, makeCitation(2)],
    ]);
    const result = parseInlineCitations("uses the store[1] and rejects[2]", map);
    expect(result).toEqual([
      { type: "text", content: "uses the store" },
      { type: "citation", label: 1, citation: makeCitation(1) },
      { type: "text", content: " and rejects" },
      { type: "citation", label: 2, citation: makeCitation(2) },
    ]);
  });

  it("treats mismatched bracket labels as plain text", () => {
    const map = new Map<number, ChatCitation>([
      [1, makeCitation(1)],
    ]);
    const result = parseInlineCitations("uses the store[1] and fake ref[99]", map);
    expect(result).toEqual([
      { type: "text", content: "uses the store" },
      { type: "citation", label: 1, citation: makeCitation(1) },
      { type: "text", content: " and fake ref" },
      { type: "text", content: "[99]" },
    ]);
  });

  it("handles text with only invalid brackets", () => {
    const map = new Map<number, ChatCitation>();
    const result = parseInlineCitations("see [0] and [2]", map);
    expect(result).toEqual([
      { type: "text", content: "see " },
      { type: "text", content: "[0]" },
      { type: "text", content: " and " },
      { type: "text", content: "[2]" },
    ]);
  });

  it("handles empty string", () => {
    const result = parseInlineCitations("", new Map());
    expect(result).toEqual([]);
  });

  it("handles brackets-only string with valid labels", () => {
    const map = new Map<number, ChatCitation>([
      [1, makeCitation(1)],
    ]);
    const result = parseInlineCitations("[1]", map);
    expect(result).toEqual([{ type: "citation", label: 1, citation: makeCitation(1) }]);
  });

  it("handles adjacent citations with no text between", () => {
    const map = new Map<number, ChatCitation>([
      [1, makeCitation(1)],
      [2, makeCitation(2)],
    ]);
    const result = parseInlineCitations("[1][2]", map);
    expect(result).toEqual([
      { type: "citation", label: 1, citation: makeCitation(1) },
      { type: "citation", label: 2, citation: makeCitation(2) },
    ]);
  });

  it("ignores non-integer bracket contents", () => {
    const map = new Map<number, ChatCitation>();
    const result = parseInlineCitations("see [abc] for details", map);
    expect(result).toEqual([{ type: "text", content: "see [abc] for details" }]);
  });

  it("handles trailing text after last citation", () => {
    const map = new Map<number, ChatCitation>([
      [1, makeCitation(1)],
    ]);
    const result = parseInlineCitations("found in auth[1].", map);
    expect(result).toEqual([
      { type: "text", content: "found in auth" },
      { type: "citation", label: 1, citation: makeCitation(1) },
      { type: "text", content: "." },
    ]);
  });

  it("resolves non-sequential labels correctly when the map has gaps", () => {
    const map = new Map<number, ChatCitation>([
      [1, makeCitation(1)],
      [3, makeCitation(3)],
    ]);
    const result = parseInlineCitations("claim a[1] and claim b[3]", map);
    expect(result).toEqual([
      { type: "text", content: "claim a" },
      { type: "citation", label: 1, citation: makeCitation(1) },
      { type: "text", content: " and claim b" },
      { type: "citation", label: 3, citation: makeCitation(3) },
    ]);
  });
});
