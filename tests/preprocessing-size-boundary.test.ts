import { describe, it, expect } from "vitest";
import AdmZip from "adm-zip";
import { validateZipSafety } from "../src/server/services/preprocessing";

// PREPROC-03 (item 7, Group 4) — the exact 500MB unpacked boundary, the one
// case testing.md has explicitly refused to round up to Agent-verified.
//
// safe-preprocessing.md, Acceptance Criteria:
//   "A repository at exactly the size/file-count limits imports successfully;
//    one file over any limit triggers the correct partial/truncated/rejected
//    behavior per the rule it violates."
// safe-preprocessing.md, Edge Cases:
//   "A file that's individually safe but pushes the repo over 500 MB unpacked
//    or 5,000 files -> the import continues, `truncated` is set, remaining
//    files past the limit are not indexed (not silently included, not
//    silently dropped without a trace)."
//
// So the 500MB rule is TRUNCATION, not rejection — distinct from the 150MB
// compressed-ZIP rule (413 rejection) and the traversal/symlink rules (422
// rejection). The only rejection case here is the degenerate one where the
// very first file already blows the budget (zero files indexed).

const MB = 1024 * 1024;
const MAX_UNPACKED = 500 * MB; // 524,288,000 bytes
const ONE_MB_EXACT = MB; // == MAX_FILE_PARSE_SIZE, so NOT over the 1MB parse
                         // ceiling — these take the main indexing path that
                         // actually performs the unpacked-size check.

// One shared buffer reused for every entry: the resulting archive genuinely
// contains N distinct 1MB files (and really writes N MB to disk during
// validation), but constructing it doesn't hold N MB in RAM at once — this
// machine is documented as memory-constrained (ADR-009: ~2-3GB free).
function makeUniformZip(fileCount: number, bytesPerFile: number, ext = "txt"): Buffer {
  const shared = Buffer.alloc(bytesPerFile, 0x61); // 'a' — plainly text, so
                                                   // binary detection can't
                                                   // divert the code path
  const zip = new AdmZip();
  for (let i = 0; i < fileCount; i++) {
    zip.addFile(`data/file-${i}.${ext}`, shared);
  }
  return zip.toBuffer();
}

describe("PREPROC-03: exact 500MB unpacked-size boundary", () => {
  it("just UNDER the limit: every file indexed, truncated stays false", async () => {
    const fileCount = 499; // 499 MB — one MB short of the ceiling
    const zip = makeUniformZip(fileCount, ONE_MB_EXACT);

    const result = await validateZipSafety(zip, `preproc03-under-${Date.now()}`);

    expect(result.totalUnpackedSize).toBe(fileCount * ONE_MB_EXACT);
    expect(result.totalUnpackedSize).toBeLessThan(MAX_UNPACKED);
    expect(result.truncated).toBe(false);
    expect(result.totalFiles).toBe(fileCount);
    expect(result.files).toHaveLength(fileCount);
  }, 600000);

  it("EXACTLY at the limit: imports successfully, nothing truncated", async () => {
    const fileCount = 500; // 500 * 1MB == exactly 524,288,000 bytes
    const zip = makeUniformZip(fileCount, ONE_MB_EXACT);

    const result = await validateZipSafety(zip, `preproc03-exact-${Date.now()}`);

    // The spec's wording is "at exactly the limits imports successfully" —
    // the boundary is inclusive, so exactly 500MB must NOT truncate.
    expect(result.totalUnpackedSize).toBe(MAX_UNPACKED);
    expect(result.truncated).toBe(false);
    expect(result.totalFiles).toBe(fileCount);
    expect(result.files).toHaveLength(fileCount);
  }, 600000);

  it("just OVER the limit: import continues, truncated set, the crossing file is NOT indexed", async () => {
    const fileCount = 501; // one file past the ceiling
    const zip = makeUniformZip(fileCount, ONE_MB_EXACT);

    const result = await validateZipSafety(zip, `preproc03-over-${Date.now()}`);

    // Not a rejection: it returns a result rather than throwing.
    expect(result.truncated).toBe(true);
    // The file that crossed the budget is not indexed, and neither is
    // anything after it — "not silently included, not silently dropped
    // without a trace": truncated is the trace.
    expect(result.totalFiles).toBe(500);
    expect(result.files).toHaveLength(500);
    expect(result.files.every((f) => f.path.startsWith("data/file-"))).toBe(true);
  }, 600000);
});

describe("PREPROC-03: 500MB budget vs. the 1MB per-file parse ceiling", () => {
  // REGRESSION TEST for a real, demonstrated defect (found 2026-08-02, fixed
  // 2026-08-02). preprocessing.ts's oversized-file branch used to do
  // `unpackedSize += entryData.length; continue;` BEFORE reaching the
  // unpacked-size check, so any file over the 1MB parse ceiling contributed
  // to the running total but could never trigger truncation. Measured before
  // the fix: 300 x 2MB = 600MB unpacked with `truncated` still false,
  // contradicting safe-preprocessing.md's edge case. The budget check now
  // runs for every entry before any early continuation.
  it("files over the 1MB parse ceiling can no longer bypass the 500MB budget", async () => {
    const fileCount = 300;
    const twoMb = 2 * MB;
    const zip = makeUniformZip(fileCount, twoMb); // would be 600MB unpacked

    const result = await validateZipSafety(zip, `preproc03-bypass-${Date.now()}`);

    // The budget is now enforced on this path: truncation fires.
    expect(result.truncated).toBe(true);

    // And the total stops at the boundary instead of sailing on to 600MB —
    // this is the assertion that would have failed before the fix.
    //
    // Note on the exact bound: `totalUnpackedSize` reports bytes ENCOUNTERED,
    // not bytes indexed, so it includes the one file that crossed the budget
    // and tripped the break. That is pre-existing behavior shared with the
    // uniform-1MB "just over" case above, deliberately left unchanged here.
    // The real invariant is therefore "within one file of the budget".
    expect(result.totalUnpackedSize).toBeLessThanOrEqual(MAX_UNPACKED + twoMb);
    expect(result.totalUnpackedSize).toBeLessThan(fileCount * twoMb); // << 600MB

    // Indexing stops at the boundary: 500MB / 2MB = 250 files fit exactly,
    // and the 251st is the one that would have crossed it, so it is not
    // indexed (same "not silently included" rule as the uniform-1MB case).
    expect(result.totalFiles).toBe(250);
    expect(result.files).toHaveLength(250);

    // The per-file parse ceiling still behaves as specified for the files
    // that DID get indexed — this fix must not have changed that.
    expect(result.files.every((f) => f.skipped)).toBe(true);
    expect(result.files.every((f) => (f.skipReason ?? "").startsWith("exceeds_max_parse_size"))).toBe(true);
    expect(result.files.every((f) => f.content === null)).toBe(true);
  }, 600000);

  it("a large text file under the repository budget is still indexed, skipped, and never parsed", async () => {
    // Guards the other direction: the fix must not turn the per-file ceiling
    // into a rejection or drop oversized files that fit within 500MB.
    const zip = makeUniformZip(3, 2 * MB); // 6MB total — far inside the budget

    const result = await validateZipSafety(zip, `preproc03-ceiling-ok-${Date.now()}`);

    expect(result.truncated).toBe(false);
    expect(result.totalFiles).toBe(3);
    expect(result.totalUnpackedSize).toBe(3 * 2 * MB);
    expect(result.files.every((f) => f.skipped && f.content === null)).toBe(true);
    expect(result.files.every((f) => (f.skipReason ?? "").startsWith("exceeds_max_parse_size"))).toBe(true);
  }, 120000);
});
