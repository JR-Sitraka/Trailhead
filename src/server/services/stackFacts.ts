import { parse } from "json5";

export interface StackFacts {
  primaryLanguage: string | null;
  framework: string | null;
  packageManager: string | null;
  buildTool: string | null;
  testFrameworkSummary: string | null;
}

export interface FileRow {
  path: string;
  language: string | null;
  skipped: boolean;
  content: string | null;
}

const LOCKFILE_PM_MAP: Record<string, string> = {
  "package-lock.json": "npm",
  "yarn.lock": "yarn",
  "pnpm-lock.yaml": "pnpm",
  "bun.lockb": "bun"
};

const BUILD_TOOL_CONFIG_MAP: Record<string, string> = {
  "next.config.js": "Next.js (built-in)",
  "next.config.ts": "Next.js (built-in)",
  "vite.config.js": "Vite",
  "vite.config.ts": "Vite",
  "webpack.config.js": "Webpack",
  "turbo.json": "Turborepo",
  "rollup.config.js": "Rollup",
  "esbuild.config.js": "esbuild"
};

const FRAMEWORK_DEP_SIGNATURES: Array<{ deps: string[]; label: string; exclude?: string[]; prefixMatch?: string }> = [
  { deps: ["next"], label: "Next.js", exclude: ["@remix-run/"] },
  { deps: ["nuxt"], label: "Nuxt" },
  { deps: ["@remix-run/core", "@remix-run/react", "@remix-run/dev"], label: "Remix", prefixMatch: "@remix-run/" },
  { deps: ["react"], label: "React", exclude: ["next", "@remix-run/"] },
  { deps: ["vue"], label: "Vue", exclude: ["nuxt"] },
  { deps: ["@angular/core"], label: "Angular" },
  { deps: ["svelte"], label: "Svelte" },
  { deps: ["express"], label: "Express" },
  { deps: ["fastify"], label: "Fastify" },
  { deps: ["@nestjs/core"], label: "NestJS" },
  { deps: ["koa"], label: "Koa" }
];

const TEST_FRAMEWORK_SIGNATURES: Array<{ dep: string; label: string }> = [
  { dep: "vitest", label: "Vitest" },
  { dep: "jest", label: "Jest" },
  { dep: "mocha", label: "Mocha" },
  { dep: "ava", label: "Ava" },
  { dep: "jasmine", label: "Jasmine" },
  { dep: "@playwright/test", label: "Playwright (e2e)" },
  { dep: "cypress", label: "Cypress" }
];

function findPackageJsonFile(files: FileRow[]): FileRow | undefined {
  const directMatch = files.find(f => f.path === "package.json");
  if (directMatch) return directMatch;
  const basenameMatch = files.find(f => f.path.split("/").pop() === "package.json");
  return basenameMatch;
}

function parsePackageJson(content: string | null): Record<string, unknown> | null {
  if (!content) return null;
  try {
    const parsed = parse(content) as Record<string, unknown>;
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

function depsFromPkg(pkg: Record<string, unknown> | null): Record<string, string> {
  if (!pkg) return {};
  const deps: Record<string, string> = {};
  const depsRaw = pkg.dependencies;
  if (depsRaw && typeof depsRaw === "object") {
    for (const [k, v] of Object.entries(depsRaw as Record<string, unknown>)) {
      if (typeof v === "string") deps[k] = v;
    }
  }
  return deps;
}

function devDepsFromPkg(pkg: Record<string, unknown> | null): Record<string, string> {
  if (!pkg) return {};
  const deps: Record<string, string> = {};
  const devDepsRaw = pkg.devDependencies;
  if (devDepsRaw && typeof devDepsRaw === "object") {
    for (const [k, v] of Object.entries(devDepsRaw as Record<string, unknown>)) {
      if (typeof v === "string") deps[k] = v;
    }
  }
  return deps;
}

function matchesDep(deps: Record<string, string>, depName: string, prefixMatch?: string): boolean {
  if (prefixMatch) {
    return Object.keys(deps).some(d => d === depName || d.startsWith(prefixMatch));
  }
  return depName in deps;
}

function matchesExclude(deps: Record<string, string>, excludes: string[]): boolean {
  return excludes.some(ex => Object.keys(deps).some(d => d === ex || d.startsWith(ex)));
}

export function detectStackFacts(files: FileRow[]): StackFacts {
  const allPaths = files.map(f => f.path);

  const packageManager = (() => {
    for (const [lockfile, pm] of Object.entries(LOCKFILE_PM_MAP)) {
      if (allPaths.some(p => p === lockfile || p.split("/").pop() === lockfile)) {
        return pm;
      }
    }
    return null;
  })();

  const nonSkippedFiles = files.filter(f => !f.skipped);
  const primaryLanguage = (() => {
    const counts = new Map<string, number>();
    for (const f of nonSkippedFiles) {
      if (f.language) {
        counts.set(f.language, (counts.get(f.language) || 0) + 1);
      }
    }
    let top: string | null = null;
    let topCount = 0;
    const entries = Array.from(counts.entries());
    for (const [lang, count] of entries) {
      if (count > topCount) {
        topCount = count;
        top = lang;
      }
    }
    return top;
  })();

  const packageJson = findPackageJsonFile(files);
  const pkg = packageJson ? parsePackageJson(packageJson.content) : null;
  const deps = depsFromPkg(pkg);
  const devDeps = devDepsFromPkg(pkg);

  const framework = (() => {
    if (!pkg) return null;
    for (const sig of FRAMEWORK_DEP_SIGNATURES) {
      const hasDep = sig.deps.some(d => matchesDep(deps, d, sig.prefixMatch));
      if (!hasDep) continue;
      if (sig.exclude && matchesExclude(deps, sig.exclude)) continue;
      return sig.label;
    }
    return null;
  })();

  const buildTool = (() => {
    for (const [configPath, label] of Object.entries(BUILD_TOOL_CONFIG_MAP)) {
      if (allPaths.some(p => p === configPath || p.split("/").pop() === configPath)) {
        return label;
      }
    }
    return null;
  })();

  const foundTestFrameworks: string[] = [];
  for (const sig of TEST_FRAMEWORK_SIGNATURES) {
    if (sig.dep in devDeps) {
      foundTestFrameworks.push(sig.label);
    }
  }
  const testFrameworkSummary = foundTestFrameworks.length > 0
    ? foundTestFrameworks.join(" + ")
    : null;

  return {
    primaryLanguage,
    framework,
    packageManager,
    buildTool,
    testFrameworkSummary
  };
}
