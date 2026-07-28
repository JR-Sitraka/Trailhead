// Content-verifies the proposed symbol ground-truth sample: for each
// proposed (path, kind, name, startLine, endLine) it slices the REAL
// file content at the pinned SHA and confirms the symbol name actually
// appears in that range. Per verification-tiers.md's "structurally
// correct code is not the same as correct content" clause — a matching
// DB row is not by itself proof the row describes reality.
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { eq, and } from "drizzle-orm";
import { benchDb, closeBenchDb } from "./db";
import { files, repositories, symbols as symbolsTable } from "../../src/server/db/schema";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROPOSED_PATH = resolve(__dirname, "..", "candidates", "proposed-symbols.json");

interface Proposed {
  repoName: string;
  filePath: string;
  expectedSymbols: Array<{ kind: string; name: string; startLine: number; endLine: number; rationale?: string }>;
}

async function main() {
  const doc = JSON.parse(readFileSync(PROPOSED_PATH, "utf8")) as { samples: Proposed[] };

  let total = 0;
  let okCount = 0;
  const failures: string[] = [];

  for (const sample of doc.samples) {
    const [repo] = await benchDb.select().from(repositories).where(eq(repositories.name, sample.repoName));
    if (!repo) throw new Error(`Repo ${sample.repoName} not in trailhead_bench`);
    const [fileRow] = await benchDb
      .select()
      .from(files)
      .where(and(eq(files.repositoryId, repo.id), eq(files.path, sample.filePath)));
    if (!fileRow || !fileRow.content) {
      failures.push(`${sample.repoName} :: ${sample.filePath} — file missing or has no content`);
      continue;
    }
    const lines = fileRow.content.split("\n");
    const dbSymbols = await benchDb.select().from(symbolsTable).where(eq(symbolsTable.fileId, fileRow.id));

    console.log(`\n=== ${sample.repoName} :: ${sample.filePath} ===`);
    for (const s of sample.expectedSymbols) {
      total++;
      const slice = lines.slice(s.startLine - 1, s.endLine).join("\n");
      const nameInContent = slice.includes(s.name);
      const dbMatch = dbSymbols.some(
        (d) => d.kind === s.kind && d.name === s.name && d.startLine === s.startLine && d.endLine === s.endLine
      );
      const ok = nameInContent && dbMatch;
      if (ok) okCount++;
      else failures.push(`${sample.filePath} :: ${s.kind} ${s.name} L${s.startLine}-${s.endLine} — contentMatch=${nameInContent} dbRowMatch=${dbMatch}`);

      const firstLine = (lines[s.startLine - 1] ?? "").trim().slice(0, 68);
      console.log(
        `  ${ok ? "OK  " : "FAIL"} | ${s.kind.padEnd(9)} | ${s.name.padEnd(22)} | L${String(s.startLine).padStart(3)}-${String(s.endLine).padEnd(3)} | ${firstLine}`
      );
    }
  }

  console.log(`\n${okCount}/${total} proposed symbols verified against real pinned content AND a matching DB row.`);
  if (failures.length > 0) {
    console.log("\nFAILURES:");
    for (const f of failures) console.log("  " + f);
    process.exitCode = 1;
  }

  await closeBenchDb();
}

main().catch(async (e) => {
  console.error(e);
  await closeBenchDb();
  process.exit(1);
});
