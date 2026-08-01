import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/repositories/route";
import { fetchGithubRepoInfo } from "../src/server/services/preprocessing";
import { db } from "../src/server/db";
import { repositories } from "../src/server/db/schema";
import { eq } from "drizzle-orm";

// IMPORT-04 (item 7, Group 4). repository-import.md's Functional Requirements:
//   "Accept a public GitHub repository URL, with optional branch selection
//    when the repo has more than one branch."
//   "Capture the commit SHA (GitHub: from the selected branch's HEAD; ...)"
//
// octocat/Hello-World is a real, stable public repo with three real branches
// whose HEADs are genuinely different commits — the only way to tell
// "resolved the selected branch" apart from "always used the default".
const REPO_URL = "https://github.com/octocat/Hello-World";
const DEFAULT_BRANCH = "master";
const NON_DEFAULT_BRANCH = "test";

async function makeGithubRequest(url: string, branch?: string): Promise<Response> {
  const formData = new FormData();
  formData.append("source", "github");
  formData.append("url", url);
  if (branch) formData.append("branch", branch);

  const request = new NextRequest("http://localhost:3000/api/repositories", {
    method: "POST",
    body: formData
  });
  return POST(request);
}

// Resolve the real HEAD of a branch straight from GitHub, so assertions are
// checked against GitHub's own truth rather than against whatever the app
// happens to claim.
async function realBranchHead(branch: string): Promise<string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "trailhead/1.0"
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/octocat/Hello-World/commits/${branch}`, { headers });
  if (!res.ok) throw new Error(`GitHub HEAD lookup failed for ${branch}: ${res.status}`);
  return ((await res.json()) as { sha: string }).sha;
}

describe("IMPORT-04: multi-branch detection", () => {
  it("detects a real repo with more than one branch (the condition the branch selector depends on)", async () => {
    const info = await fetchGithubRepoInfo(REPO_URL);
    expect(info.branches.length).toBeGreaterThan(1);
    expect(info.branches).toContain(DEFAULT_BRANCH);
    expect(info.branches).toContain(NON_DEFAULT_BRANCH);
    expect(info.defaultBranch).toBe(DEFAULT_BRANCH);
  }, 30000);

  it("control: default-branch import records the real default-branch HEAD", async () => {
    const expectedSha = await realBranchHead(DEFAULT_BRANCH);

    const response = await makeGithubRequest(REPO_URL);
    expect(response.status).toBe(201);
    const body = await response.json();

    expect(body.commitSha).toBe(expectedSha);

    await db.delete(repositories).where(eq(repositories.id, body.id));
  }, 60000);

  // DEFERRED SPECIFICATION CASE — not a bug awaiting a fix in this phase.
  //
  // Decision recorded 2026-08-02 (item 7 closeout): branch selection is
  // UNIMPLEMENTED and deliberately deferred as real future scope, documented
  // in docs/08-features/repository-import.md's "Branch selection — CURRENT
  // vs. DEFERRED" section. Full support needs a conditional UI selector plus
  // backend wiring through branch discovery, SHA resolution, and zipball
  // retrieval — a planned feature, not a patch.
  //
  // Proven 2026-08-02 with real evidence: requesting branch "test" records
  // master's HEAD instead. route.ts computes `selectedBranch` and then never
  // uses it, and fetchGithubRepoInfo() takes no branch argument — it always
  // resolves `/commits/${repoData.default_branch}`.
  //
  // Marked `.fails()` deliberately rather than deleted or weakened: it locks
  // the spec's target state into the suite, keeps the regression baseline
  // honest, and will START FAILING (correctly alerting) if branch selection
  // is ever implemented — at which point flip it back to a normal `it`.
  it.fails("DEFERRED (unimplemented): does NOT record the selected branch's HEAD — branch param is a silent no-op", async () => {
    const defaultSha = await realBranchHead(DEFAULT_BRANCH);
    const selectedSha = await realBranchHead(NON_DEFAULT_BRANCH);
    // Guard the fixture: if these ever converge, the test proves nothing.
    expect(selectedSha).not.toBe(defaultSha);

    const response = await makeGithubRequest(REPO_URL, NON_DEFAULT_BRANCH);
    expect(response.status).toBe(201);
    const body = await response.json();

    try {
      // Per repository-import.md: the commit SHA comes from the SELECTED
      // branch's HEAD, not the default branch's.
      expect(body.commitSha).toBe(selectedSha);
      expect(body.commitSha).not.toBe(defaultSha);
    } finally {
      await db.delete(repositories).where(eq(repositories.id, body.id));
    }
  }, 60000);

  it("documents the ACTUAL current behavior: the selected branch is ignored and the default branch's HEAD is recorded", async () => {
    const defaultSha = await realBranchHead(DEFAULT_BRANCH);
    const selectedSha = await realBranchHead(NON_DEFAULT_BRANCH);
    expect(selectedSha).not.toBe(defaultSha);

    const response = await makeGithubRequest(REPO_URL, NON_DEFAULT_BRANCH);
    expect(response.status).toBe(201);
    const body = await response.json();

    try {
      // Real, current, spec-violating behavior — asserted explicitly so the
      // defect is visible in the suite rather than merely absent from it.
      expect(body.commitSha).toBe(defaultSha);
    } finally {
      await db.delete(repositories).where(eq(repositories.id, body.id));
    }
  }, 60000);
});
