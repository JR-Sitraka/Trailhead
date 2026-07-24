import { describe, it, expect } from "vitest";
import { detectStackFacts, type FileRow } from "../src/server/services/stackFacts";

function makeFile(path: string, opts?: Partial<FileRow>): FileRow {
  return {
    path,
    language: null,
    skipped: false,
    content: null,
    ...opts
  };
}

describe("detectStackFacts", () => {
  describe("packageManager", () => {
    it("detects npm from package-lock.json", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: '{"name":"x"}' }),
        makeFile("package-lock.json")
      ];
      const result = detectStackFacts(files);
      expect(result.packageManager).toBe("npm");
    });

    it("detects yarn from yarn.lock", () => {
      const files: FileRow[] = [
        makeFile("yarn.lock")
      ];
      const result = detectStackFacts(files);
      expect(result.packageManager).toBe("yarn");
    });

    it("detects pnpm from pnpm-lock.yaml", () => {
      const files: FileRow[] = [
        makeFile("pnpm-lock.yaml")
      ];
      const result = detectStackFacts(files);
      expect(result.packageManager).toBe("pnpm");
    });

    it("detects bun from bun.lockb", () => {
      const files: FileRow[] = [
        makeFile("bun.lockb")
      ];
      const result = detectStackFacts(files);
      expect(result.packageManager).toBe("bun");
    });

    it("returns null when no lockfile is present", () => {
      const files: FileRow[] = [
        makeFile("README.md"),
        makeFile("src/index.ts")
      ];
      const result = detectStackFacts(files);
      expect(result.packageManager).toBeNull();
    });
  });

  describe("primaryLanguage", () => {
    it("returns the most common non-skipped language by count", () => {
      const files: FileRow[] = [
        makeFile("a.ts", { language: "typescript" }),
        makeFile("b.ts", { language: "typescript" }),
        makeFile("c.js", { language: "javascript" }),
        makeFile("d.js", { language: "javascript" }),
        makeFile("e.js", { language: "javascript" })
      ];
      const result = detectStackFacts(files);
      expect(result.primaryLanguage).toBe("javascript");
    });

    it("ignores skipped files for language counting", () => {
      const files: FileRow[] = [
        makeFile("a.ts", { language: "typescript" }),
        makeFile("b.ts", { language: "typescript", skipped: true }),
        makeFile("c.js", { language: "javascript" })
      ];
      const result = detectStackFacts(files);
      expect(result.primaryLanguage).toBe("typescript");
    });

    it("returns null when no files have a language", () => {
      const files: FileRow[] = [
        makeFile("README.md"),
        makeFile("LICENSE")
      ];
      const result = detectStackFacts(files);
      expect(result.primaryLanguage).toBeNull();
    });
  });

  describe("framework", () => {
    it("detects Next.js from next in dependencies", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: JSON.stringify({ dependencies: { next: "^14.0.0", react: "^18.0.0" } }) })
      ];
      const result = detectStackFacts(files);
      expect(result.framework).toBe("Next.js");
    });

    it("detects Nuxt from nuxt in dependencies", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: JSON.stringify({ dependencies: { nuxt: "^3.0.0", vue: "^3.0.0" } }) })
      ];
      const result = detectStackFacts(files);
      expect(result.framework).toBe("Nuxt");
    });

    it("detects Remix from @remix-run/* packages", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: JSON.stringify({ dependencies: { "@remix-run/react": "^2.0.0", react: "^18.0.0" } }) })
      ];
      const result = detectStackFacts(files);
      expect(result.framework).toBe("Remix");
    });

    it("detects React without next/remix", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: JSON.stringify({ dependencies: { react: "^18.0.0" } }) })
      ];
      const result = detectStackFacts(files);
      expect(result.framework).toBe("React");
    });

    it("returns null for Next.js when remix is also present (priority)", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: JSON.stringify({ dependencies: { next: "^14.0.0", react: "^18.0.0" } }) })
      ];
      const result = detectStackFacts(files);
      expect(result.framework).toBe("Next.js");
    });

    it("does not return React when next is present", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: JSON.stringify({ dependencies: { next: "^14.0.0", react: "^18.0.0" } }) })
      ];
      const result = detectStackFacts(files);
      expect(result.framework).not.toBe("React");
    });

    it("detects Vue without nuxt", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: JSON.stringify({ dependencies: { vue: "^3.0.0" } }) })
      ];
      const result = detectStackFacts(files);
      expect(result.framework).toBe("Vue");
    });

    it("does not return Vue when nuxt is present", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: JSON.stringify({ dependencies: { nuxt: "^3.0.0", vue: "^3.0.0" } }) })
      ];
      const result = detectStackFacts(files);
      expect(result.framework).not.toBe("Vue");
      expect(result.framework).toBe("Nuxt");
    });

    it("detects Angular", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: JSON.stringify({ dependencies: { "@angular/core": "^17.0.0" } }) })
      ];
      const result = detectStackFacts(files);
      expect(result.framework).toBe("Angular");
    });

    it("detects Svelte", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: JSON.stringify({ dependencies: { svelte: "^4.0.0" } }) })
      ];
      const result = detectStackFacts(files);
      expect(result.framework).toBe("Svelte");
    });

    it("detects Express", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: JSON.stringify({ dependencies: { express: "^4.0.0" } }) })
      ];
      const result = detectStackFacts(files);
      expect(result.framework).toBe("Express");
    });

    it("detects Fastify", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: JSON.stringify({ dependencies: { fastify: "^4.0.0" } }) })
      ];
      const result = detectStackFacts(files);
      expect(result.framework).toBe("Fastify");
    });

    it("detects NestJS", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: JSON.stringify({ dependencies: { "@nestjs/core": "^10.0.0" } }) })
      ];
      const result = detectStackFacts(files);
      expect(result.framework).toBe("NestJS");
    });

    it("detects Koa", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: JSON.stringify({ dependencies: { koa: "^2.0.0" } }) })
      ];
      const result = detectStackFacts(files);
      expect(result.framework).toBe("Koa");
    });

    it("returns null when no package.json exists", () => {
      const files: FileRow[] = [
        makeFile("main.rs"),
        makeFile("Cargo.toml")
      ];
      const result = detectStackFacts(files);
      expect(result.framework).toBeNull();
    });

    it("returns null for unknown dependencies", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: JSON.stringify({ dependencies: { "unknown-lib": "^1.0.0" } }) })
      ];
      const result = detectStackFacts(files);
      expect(result.framework).toBeNull();
    });
  });

  describe("buildTool", () => {
    it("detects Next.js built-in from next.config.js", () => {
      const files: FileRow[] = [
        makeFile("next.config.js")
      ];
      const result = detectStackFacts(files);
      expect(result.buildTool).toBe("Next.js (built-in)");
    });

    it("detects Next.js built-in from next.config.ts", () => {
      const files: FileRow[] = [
        makeFile("next.config.ts")
      ];
      const result = detectStackFacts(files);
      expect(result.buildTool).toBe("Next.js (built-in)");
    });

    it("detects Vite from vite.config.js", () => {
      const files: FileRow[] = [
        makeFile("vite.config.js")
      ];
      const result = detectStackFacts(files);
      expect(result.buildTool).toBe("Vite");
    });

    it("detects Webpack from webpack.config.js", () => {
      const files: FileRow[] = [
        makeFile("webpack.config.js")
      ];
      const result = detectStackFacts(files);
      expect(result.buildTool).toBe("Webpack");
    });

    it("detects Turborepo from turbo.json", () => {
      const files: FileRow[] = [
        makeFile("turbo.json")
      ];
      const result = detectStackFacts(files);
      expect(result.buildTool).toBe("Turborepo");
    });

    it("detects Rollup from rollup.config.js", () => {
      const files: FileRow[] = [
        makeFile("rollup.config.js")
      ];
      const result = detectStackFacts(files);
      expect(result.buildTool).toBe("Rollup");
    });

    it("detects esbuild from esbuild.config.js", () => {
      const files: FileRow[] = [
        makeFile("esbuild.config.js")
      ];
      const result = detectStackFacts(files);
      expect(result.buildTool).toBe("esbuild");
    });

    it("finds config files nested in subdirectories", () => {
      const files: FileRow[] = [
        makeFile("apps/web/vite.config.ts")
      ];
      const result = detectStackFacts(files);
      expect(result.buildTool).toBe("Vite");
    });

    it("returns null when no known build config is present", () => {
      const files: FileRow[] = [
        makeFile("package.json"),
        makeFile("tsconfig.json")
      ];
      const result = detectStackFacts(files);
      expect(result.buildTool).toBeNull();
    });

    it("returns null for framework present only in devDependencies", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: JSON.stringify({ devDependencies: { express: "^4.0.0" } }) })
      ];
      const result = detectStackFacts(files);
      expect(result.framework).toBeNull();
    });
  });

  describe("testFrameworkSummary", () => {
    it("detects single test framework from devDependencies", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: JSON.stringify({ devDependencies: { vitest: "^1.0.0" } }) })
      ];
      const result = detectStackFacts(files);
      expect(result.testFrameworkSummary).toBe("Vitest");
    });

    it("detects multiple test frameworks joined with +", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: JSON.stringify({ devDependencies: { jest: "^29.0.0", "@playwright/test": "^1.0.0" } }) })
      ];
      const result = detectStackFacts(files);
      expect(result.testFrameworkSummary).toBe("Jest + Playwright (e2e)");
    });

    it("detects cypress", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: JSON.stringify({ devDependencies: { cypress: "^13.0.0" } }) })
      ];
      const result = detectStackFacts(files);
      expect(result.testFrameworkSummary).toBe("Cypress");
    });

    it("returns null when no known test framework is in devDependencies", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: JSON.stringify({ devDependencies: { typescript: "^5.0.0" } }) })
      ];
      const result = detectStackFacts(files);
      expect(result.testFrameworkSummary).toBeNull();
    });

    it("returns null when no package.json exists", () => {
      const files: FileRow[] = [
        makeFile("src/main.go")
      ];
      const result = detectStackFacts(files);
      expect(result.testFrameworkSummary).toBeNull();
    });
  });

  describe("integration: Next.js project", () => {
    it("detects the full stack for a typical Next.js project", () => {
      const files: FileRow[] = [
        makeFile("package.json", {
          content: JSON.stringify({
            dependencies: { next: "^14.0.0", react: "^18.0.0", "react-dom": "^18.0.0" },
            devDependencies: { typescript: "^5.0.0", vitest: "^1.0.0" }
          })
        }),
        makeFile("package-lock.json"),
        makeFile("next.config.js"),
        makeFile("src/app/page.tsx", { language: "typescript" }),
        makeFile("src/app/layout.tsx", { language: "typescript" }),
        makeFile("src/components/Button.tsx", { language: "typescript" }),
        makeFile("src/utils/helpers.ts", { language: "typescript" })
      ];
      const result = detectStackFacts(files);
      expect(result.packageManager).toBe("npm");
      expect(result.primaryLanguage).toBe("typescript");
      expect(result.framework).toBe("Next.js");
      expect(result.buildTool).toBe("Next.js (built-in)");
      expect(result.testFrameworkSummary).toBe("Vitest");
    });
  });

  describe("graceful handling of missing/invalid package.json", () => {
    it("returns nulls for all fields when no package.json and no lockfiles", () => {
      const files: FileRow[] = [
        makeFile("main.py"),
        makeFile("requirements.txt"),
        makeFile("README.md")
      ];
      const result = detectStackFacts(files);
      expect(result.packageManager).toBeNull();
      expect(result.primaryLanguage).toBeNull();
      expect(result.framework).toBeNull();
      expect(result.buildTool).toBeNull();
      expect(result.testFrameworkSummary).toBeNull();
    });

    it("does not throw on malformed package.json content", () => {
      const files: FileRow[] = [
        makeFile("package.json", { content: "not valid json {{{" })
      ];
      const result = detectStackFacts(files);
      expect(result.framework).toBeNull();
      expect(result.testFrameworkSummary).toBeNull();
    });
  });
});
