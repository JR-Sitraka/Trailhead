import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../src/server/db";
import { repositories, files } from "../src/server/db/schema";
import { eq, like } from "drizzle-orm";
import { detectStackFacts } from "../src/server/services/stackFacts";

const GOT_PACKAGE_JSON = `{"name":"got","version":"15.1.0","description":"Human-friendly and powerful HTTP request library for Node.js","license":"MIT","repository":"sindresorhus/got","type":"module","exports":{"types":"./dist/source/index.d.ts","default":"./dist/source/index.js"},"sideEffects":false,"engines":{"node":">=22"},"scripts":{"test":"xo && tsc --noEmit && NODE_OPTIONS='--import=tsx/esm' ava","test:coverage":"xo && tsc --noEmit && NODE_OPTIONS='--import=tsx/esm' c8 ava","release":"np","build":"del-cli dist && tsc","prepare":"npm run build"},"files":["dist/source"],"keywords":["http","https","http2","get","got","url","uri","request","simple","curl","wget","fetch","net","network","gzip","brotli","zstd","zstandard","requests","human-friendly","axios","superagent","node-fetch","ky"],"dependencies":{"@sindresorhus/is":"^8.0.0","byte-counter":"^0.1.0","cacheable-request":"^13.0.18","chunk-data":"^0.1.0","decompress-response":"^10.0.0","keyv":"^5.6.0","lowercase-keys":"^4.0.1","responselike":"^4.0.2","type-fest":"^5.6.0","uint8array-extras":"^1.5.0"},"devDependencies":{"@hapi/bourne":"^3.0.0","@sindresorhus/tsconfig":"^8.1.0","@sinonjs/fake-timers":"^15.3.2","@types/benchmark":"^2.1.5","@types/express":"^5.0.6","@types/node":"^25.6.0","@types/pem":"^1.14.4","@types/readable-stream":"^4.0.23","@types/request":"^2.48.13","@types/sinon":"^21.0.0","@types/sinonjs__fake-timers":"^15.0.1","ava":"^6.4.1","axios":"^1.15.1","benchmark":"^2.1.4","bluebird":"^3.7.2","body-parser":"^2.2.2","c8":"^11.0.0","create-cert":"^1.0.6","create-test-server":"^3.0.1","del-cli":"^7.0.0","delay":"^7.0.0","expect-type":"^1.3.0","express":"^5.2.1","get-stream":"^9.0.1","node-fetch":"^3.3.2","np":"^11.2.0","p-event":"^7.1.0","pem":"^1.14.8","pify":"^6.1.0","quick-lru":"^7.3.0","readable-stream":"^4.7.0","request":"^2.88.2","sinon":"^21.1.2","slow-stream":"0.0.4","tempy":"^3.2.0","then-busboy":"^5.2.1","tough-cookie":"^6.0.0","tsx":"^4.21.0","typescript":"^5.9.3","xo":"^1.2.3"},"ava":{"files":["test/*","!test/*.types.ts"],"timeout":"10m","extensions":{"ts":"module"},"workerThreads":false},"c8":{"reporter":["text","html","lcov"],"exclude":["test/**","dist/**"]},"xo":{"ignores":["documentation/examples/*"],"rules":{"@typescript-eslint/no-empty-function":"off","n/no-deprecated-api":"off","@typescript-eslint/no-implicit-any-catch":"off","ava/assertion-arguments":"off","@typescript-eslint/no-unsafe-member-access":"off","@typescript-eslint/no-unsafe-return":"off","@typescript-eslint/no-unsafe-assignment":"off","@typescript-eslint/no-unsafe-call":"off","@typescript-eslint/await-thenable":"off","@typescript-eslint/no-redundant-type-constituents":"off","@typescript-eslint/no-unsafe-argument":"off","@typescript-eslint/promise-function-async":"off","no-lone-blocks":"off","unicorn/no-await-expression-member":"off","unicorn/prefer-event-target":"off"}},"runkitExampleFilename":"./documentation/examples/runkit-example.js"}`;

describe("detectStackFacts — sindresorhus/got real fixture", () => {
  const REPO_PREFIX = "got-e2e-";

  beforeAll(async () => {
    const leftover = await db.select().from(repositories).where(like(repositories.name, `${REPO_PREFIX}%`));
    for (const r of leftover) {
      await db.delete(repositories).where(eq(repositories.id, r.id));
    }
  });

  afterAll(async () => {
    const leftover = await db.select().from(repositories).where(like(repositories.name, `${REPO_PREFIX}%`));
    for (const r of leftover) {
      await db.delete(repositories).where(eq(repositories.id, r.id));
    }
  });

  it("detects the correct stack facts for the real got repository data", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${REPO_PREFIX}${Date.now()}`,
      source: "zip",
      sourceUrl: null,
      commitSha: null
    }).returning();

    const gotFiles = [
      { path: "package.json", language: "json" as string | null, skipped: false, content: GOT_PACKAGE_JSON },
      { path: "tsconfig.json", language: "json" as string | null, skipped: false, content: "{}" },
      { path: "readme.md", language: "markdown" as string | null, skipped: false, content: "# got" },
      { path: "source/index.ts", language: "typescript" as string | null, skipped: false, content: "export const got = () => {};" },
      { path: "source/http.ts", language: "typescript" as string | null, skipped: false, content: "export const request = () => {};" },
      { path: "source/response.ts", language: "typescript" as string | null, skipped: false, content: "export const Response = () => {};" },
      { path: "test/http.ts", language: "typescript" as string | null, skipped: false, content: "import ava from 'ava';" },
      { path: "documentation/examples/example.js", language: "javascript" as string | null, skipped: false, content: "const got = require('got');" },
      { path: "license", language: null as string | null, skipped: false, content: "MIT" },
      { path: ".gitignore", language: null as string | null, skipped: true, content: null, skipReason: "binary_file" as string | null }
    ];

    await db.insert(files).values(
      gotFiles.map(f => ({
        repositoryId: repo.id,
        path: f.path,
        size: f.content?.length || 0,
        language: f.language,
        skipped: f.skipped,
        skipReason: f.skipReason || null,
        content: f.content,
        category: null
      }))
    );

    const repoFiles = await db.select().from(files).where(eq(files.repositoryId, repo.id));
    const facts = detectStackFacts(
      repoFiles.map(f => ({
        path: f.path,
        language: f.language,
        skipped: f.skipped,
        content: f.content
      }))
    );

    console.log("sindresorhus/got detected facts:", JSON.stringify(facts, null, 2));

    expect(facts.primaryLanguage).toBe("typescript");
    expect(facts.framework).toBeNull();
    expect(facts.packageManager).toBeNull();
    expect(facts.buildTool).toBeNull();
    expect(facts.testFrameworkSummary).toBe("Ava");
  }, 30000);
});
