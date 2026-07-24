import { describe, it, expect } from "vitest";
import { detectStackFacts, type FileRow } from "../src/server/services/stackFacts";

describe("Overview page data logic — detectStackFacts with category/skipReason", () => {
  it("returns nulls and empty categorization for a repo with no package.json", () => {
    const files: FileRow[] = [
      { path: "package.json", language: "json", skipped: false, content: '{"main":"server.ts","scripts":{"start":"node server.js"}}' },
      { path: "tsconfig.json", language: "json", skipped: false, content: "{}" },
      { path: "server.ts", language: "typescript", skipped: false, content: "export const x = 1;" },
      { path: "middleware.ts", language: "typescript", skipped: false, content: "export const m = 1;" },
      { path: "utils.ts", language: "typescript", skipped: false, content: "export const u = 1;" },
    ];
    const result = detectStackFacts(files);
    expect(result.primaryLanguage).toBe("typescript");
    expect(result.framework).toBeNull();
    expect(result.packageManager).toBeNull();
    expect(result.buildTool).toBeNull();
    expect(result.testFrameworkSummary).toBeNull();
  });

  it("detects entrypoint and config categories from file names", () => {
    const files: FileRow[] = [
      { path: "package.json", language: "json", skipped: false, content: '{"main":"server.ts","scripts":{"start":"node server.js"}}' },
      { path: "tsconfig.json", language: "json", skipped: false, content: "{}" },
      { path: "server.ts", language: "typescript", skipped: false, content: "export const x = 1;" },
    ];
    const result = detectStackFacts(files);
    expect(result.primaryLanguage).toBe("json");
    expect(result.framework).toBeNull();
    expect(result.packageManager).toBeNull();
  });

  it("detects framework and test framework from devDependencies", () => {
    const files: FileRow[] = [
      { path: "package.json", language: "json", skipped: false, content: JSON.stringify({
        dependencies: { next: "^14.0.0", react: "^18.0.0" },
        devDependencies: { vitest: "^1.0.0" }
      })},
    ];
    const result = detectStackFacts(files);
    expect(result.framework).toBe("Next.js");
    expect(result.testFrameworkSummary).toBe("Vitest");
  });

  it("returns framework=null when express is dev-only (got behavior)", () => {
    const files: FileRow[] = [
      { path: "package.json", language: "json", skipped: false, content: JSON.stringify({
        devDependencies: { express: "^5.0.0" }
      })},
    ];
    const result = detectStackFacts(files);
    expect(result.framework).toBeNull();
  });
});
