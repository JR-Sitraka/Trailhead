import { describe, expect, it, vi, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../src/server/db";
import {
  repositories,
  analysisJobs,
  files,
  embeddingChunks as ecTable,
} from "../src/server/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  validateQuestion,
  validateAnswerLabels,
  processChatQuestion,
  RETRIEVAL_K,
  NO_EVIDENCE_THRESHOLD,
} from "../src/server/services/chat";
import { POST } from "../src/app/api/repositories/[id]/chat/route";

// ---------------------------------------------------------------------------
// Mutable per-test control shared with the Mock factory's closure.
// Injected via vi.hoisted so the factory's `require` path resolves from
// tests/ directory.
// ---------------------------------------------------------------------------
const genaictx: {
  responseText: string;
  rejectStatus: number | null;
  rejectMessage: string;
  genRespCount: number;
} = {
  responseText: '{"status":"off_topic","answer":"Off topic.","citations":[]}',
  rejectStatus: null,
  rejectMessage: "",
  genRespCount: 0,
};

function setGenaiAnswer(text: string) {
  genaictx.responseText = text;
  genaictx.rejectStatus = null;
  genaictx.rejectMessage = "";
  genaictx.genRespCount = 0;
}

function setGenaiReject(status: number, message: string) {
  genaictx.responseText = "";
  genaictx.rejectStatus = status;
  genaictx.rejectMessage = message;
  genaictx.genRespCount = 0;
}

function resetGenaiMock() {
  genaictx.responseText = '{"status":"off_topic","answer":"Off topic.","citations":[]}';
  genaictx.rejectStatus = null;
  genaictx.rejectMessage = "";
  genaictx.genRespCount = 0;
}

vi.mock("groq-sdk", () => {
  const FakeGroq: any = class FakeGroq {
    constructor(..._args: any[]) {
      genaictx.genRespCount++;
      return {
        chat: {
          completions: {
            create: async () => {
              if (genaictx.rejectStatus !== null) {
                const err: any = new Error(genaictx.rejectMessage);
                err.status = genaictx.rejectStatus;
                throw err;
              }
              return { choices: [{ message: { content: genaictx.responseText } }] };
            },
          },
        },
      };
    }
  };
  return { default: FakeGroq };
});

// ---------------------------------------------------------------------------
// Test-data helpers
// ---------------------------------------------------------------------------
const WRK_PREFIX = `chat-${Date.now()}`;

// A realistic TS file with an express import, a named function, and a class.
const FILE_CONTENT = [
  `import express from "express";`,
  `import { greet } from "./utils";`,
  ``,
  `export function greet(name: string): string {`,
  `  if (!name) return "world";`,
  `  return \`Hello, \${name}!\`;`,
  `}`,
  ``,
  `export class App {`,
  `  constructor(private port: number) {}`,
  ``,
  `  start(): void {`,
  `    console.log(\`Server on \${this.port}\`);`,
  `  }`,
  `}`,
].join("\n");

// Deterministic near-embedding. Stored chunks use this fixed vector so the
// cosine distance to any query embedding is predictable regardless of the
// query text. Self-similarity (query uses this same vector when chunked via
// generateEmbeddings in processChatQuestion) gives distance near 0.
const KNOWN_NEAR_EMBEDDING = new Array(384).fill(0).map((_, i) => 0.2 + 0.001 * i);

beforeEach(() => {
  genaictx.genRespCount = 0;
  resetGenaiMock();
  resetNoEvidenceThreshold();
});

afterEach(() => {
  resetGenaiMock();
});

async function seedRepo(): Promise<{ repositoryId: string; fileId: string }> {
  const [repo] = await db.insert(repositories).values({
    name: `${WRK_PREFIX}-${Math.random().toString(36).slice(2, 8)}`,
    source: "zip",
    sourceUrl: null,
    commitSha: null,
    status: "ready",
  }).returning();

  const [job] = await db.insert(analysisJobs).values({
    repositoryId: repo.id,
    status: "queued",
    truncated: false,
    parsingCompletedAt: new Date(),
    embeddingCompletedAt: new Date(),
  }).returning();

  const [f] = await db.insert(files).values({
    repositoryId: repo.id,
    path: "src/index.ts",
    size: FILE_CONTENT.length,
    language: "typescript",
    content: FILE_CONTENT,
    skipped: false,
    skipReason: null,
  }).returning();

  // Two symbol-bounded chunks: `greet` (lines 4-7) and `App` (lines 9-14)
  const symbolRanges = [
    { kind: "function" as const, startLine: 4, endLine: 7 },
    { kind: "class" as const, startLine: 9, endLine: 14 },
  ];

  for (const sym of symbolRanges) {
    await db.insert(ecTable).values({
      fileId: f.id,
      repositoryId: repo.id,
      startLine: sym.startLine,
      endLine: sym.endLine,
      embedding: KNOWN_NEAR_EMBEDDING,
    });
  }

  await db.update(analysisJobs).set({ status: "completed" }).where(eq(analysisJobs.id, job.id));
  await db.update(repositories).set({ status: "ready" }).where(eq(repositories.id, repo.id));

  return { repositoryId: repo.id, fileId: f.id };
}

async function makeChatRequest(repoId: string, body: Record<string, unknown>): Promise<{ resp: Response; body: any }> {
  const request = new NextRequest(`http://localhost/api/repositories/${repoId}/chat`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  const resp = await POST(request, { params: { id: repoId } });
  return { resp, body: await resp.json() };
}

// ---------------------------------------------------------------------------
// Global cleanup
// ---------------------------------------------------------------------------
beforeAll(async () => {
  const leftovers = await db.select().from(repositories).where(
    sql`${repositories.name}::TEXT LIKE ${`${WRK_PREFIX}%`}`
  );
  for (const r of leftovers) {
    await db.delete(repositories).where(eq(repositories.id, r.id));
  }
});

afterAll(async () => {
  const leftovers = await db.select().from(repositories).where(
    sql`${repositories.name}::TEXT LIKE ${`${WRK_PREFIX}%`}`
  );
  for (const r of leftovers) {
    await db.delete(repositories).where(eq(repositories.id, r.id));
  }
});

// ===========================================================================
// Unit: validateQuestion
// ===========================================================================
describe("validateQuestion (unit)", () => {
  it("rejects empty string", () => {
    expect(() => validateQuestion("")).toThrow("Question is required");
  });

  it("rejects whitespace-only question", () => {
    expect(() => validateQuestion("   ")).toThrow("Question is required");
  });

  it("rejects question > 500 characters", () => {
    expect(() => validateQuestion("a".repeat(501))).toThrow(
      "Question must be at most 500 characters"
    );
  });

  it("accepts exactly 500 characters", () => {
    expect(() => validateQuestion("a".repeat(500))).not.toThrow();
  });

  it("accepts a normal question", () => {
    expect(() => validateQuestion("Where is express imported?")).not.toThrow();
  });
});

// ===========================================================================
// Unit: validateAnswerLabels
// ===========================================================================
describe("validateAnswerLabels (unit)", () => {
  it("returns true for an empty citations array (no-op)", () => {
    expect(validateAnswerLabels([], 4, ["c1", "c2", "c3", "c4"])).toBe(true);
  });

  it("returns false for an out-of-range label (label > K) — directly forces no_evidence contract", () => {
    // K=2, retrieved=[c1,c2]. Citation [3] exceeds valid label space → false.
    // processChatQuestion discards the answer and returns no_evidence.
    expect(validateAnswerLabels([3], 2, ["c1", "c2"])).toBe(false);
  });

  it("returns false for a label below 1", () => {
    expect(validateAnswerLabels([0], 3, ["c1", "c2", "c3"])).toBe(false);
  });

  it("returns false for a non-integer label", () => {
    expect(validateAnswerLabels([1.5], 3, ["c1", "c2", "c3"])).toBe(false);
  });

  it("returns false when the model invents fabricated labels (e.g. [6,7] when K=5)", () => {
    expect(validateAnswerLabels([6, 7], 5, ["c1", "c2", "c3", "c4", "c5"])).toBe(false);
  });

  it("returns false for a negative label", () => {
    expect(validateAnswerLabels([-1], 3, ["c1", "c2", "c3"])).toBe(false);
  });

  it("returns true for all valid integer labels within [1, K]", () => {
    expect(validateAnswerLabels([1, 3, 5], 5, ["c1", "c2", "c3", "c4", "c5"])).toBe(true);
  });
});

// ===========================================================================
// E2E: 404 → no retrieval/generation
// ===========================================================================
describe("POST /api/repositories/:id/chat — 404 nonexistent repo", () => {
  it("returns 404; no generation call was made (no DB request for retrieval attempted)", async () => {
    const { resp, body } = await makeChatRequest("00000000-0000-0000-0000-000000000000", {
      question: "anything"
    });
    expect(resp.status).toBe(404);
    expect(body.error).toBe("Repository not found");
    expect(genaictx.genRespCount).toBe(0);
  });
});

// ===========================================================================
// E2E: 409 for non-ready repositories
// ===========================================================================
describe("POST /api/repositories/:id/chat — 409 not-ready", () => {
  it("returns 409 when status=analyzing", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${WRK_PREFIX}-analyzing-`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "analyzing",
    }).returning();

    const { resp, body } = await makeChatRequest(repo.id, { question: "anything?" });
    expect(resp.status).toBe(409);
    expect(body.error).toBeTruthy();

    await db.delete(repositories).where(eq(repositories.id, repo.id));
  });

  it("returns 409 when status=failed", async () => {
    const [repo] = await db.insert(repositories).values({
      name: `${WRK_PREFIX}-failed-`,
      source: "zip",
      sourceUrl: null,
      commitSha: null,
      status: "failed",
    }).returning();

    const { resp, body } = await makeChatRequest(repo.id, { question: "anything?" });
    expect(resp.status).toBe(409);

    await db.delete(repositories).where(eq(repositories.id, repo.id));
  });
});

// ===========================================================================
// E2E: 400 empty question — gate rejects before retrieval
// ===========================================================================
describe("POST /api/repositories/:id/chat — 400 empty question", () => {
  it("returns 400 without firing retrieval or generation", async () => {
    const { repositoryId } = await seedRepo();

    const { resp, body } = await makeChatRequest(repositoryId, { question: "" });
    expect(resp.status).toBe(400);
    expect(genaictx.genRespCount).toBe(0);
  });
});

// ===========================================================================
// E2E: 400 over-500 chars — gate rejects before retrieval
// ===========================================================================
describe("POST /api/repositories/:id/chat — 400 over-length", () => {
  it("returns 400 for a 501-char question; no generation", async () => {
    const { repositoryId } = await seedRepo();

    const { resp, body } = await makeChatRequest(repositoryId, { question: "a".repeat(501) });
    expect(resp.status).toBe(400);
    expect(genaictx.genRespCount).toBe(0);
  });
});

// ===========================================================================
// E2E: 422 non-empty history (Slice 1 — always reject before retrieval)
// ===========================================================================
describe("POST /api/repositories/:id/chat — 422 non-empty history (Slice 1)", () => {
  it("returns 422 for non-empty history without calling generation", async () => {
    const { repositoryId } = await seedRepo();

    const { resp, body } = await makeChatRequest(repositoryId, {
      question: "anything",
      history: [{ question: "prev", answer: null, citations: [] }],
    });
    expect(resp.status).toBe(422);
    expect(body.error).toContain("history");
    expect(genaictx.genRespCount).toBe(0);
  });
});

/**
 * Force the no-evidence cosine-distance threshold to a very high value so
 * any retrieval result passes — used for tests that need to reach generation.
 * Reset automatically in afterEach.
 */
async function disableNoEvidenceThreshold() {
  const { setNoEvidenceThresholdOverride } = await import("../src/server/services/chat");
  setNoEvidenceThresholdOverride(Infinity);
}

async function resetNoEvidenceThreshold() {
  const { setNoEvidenceThresholdOverride } = await import("../src/server/services/chat");
  setNoEvidenceThresholdOverride(null);
}

// ===========================================================================
// E2E: off_topic — Gemini returns off_topic for an unrelated question.
// Retrieval runs on real/near embeddings; generation is mocked to return off_topic.
// ===========================================================================
describe("POST /api/repositories/:id/chat — off_topic", () => {
  it("returns status=off_topic and empty citations for an unrelated question", { timeout: 15000 }, async () => {
    const { repositoryId } = await seedRepo();
    await disableNoEvidenceThreshold();

    setGenaiAnswer(
      '{"status":"off_topic","answer":"This evidence is about a code repository. Weather is unrelated to the content.","citations":[]}'
    );

    const { resp, body } = await makeChatRequest(repositoryId, {
      question: "What is the weather like today?",
    });
    expect(resp.status).toBe(200);
    expect(body.status).toBe("off_topic");
    expect(body.answer).toBeTruthy();
    expect(body.citations).toEqual([]);
    expect(genaictx.genRespCount).toBe(1);
  });
});

// ===========================================================================
// E2E: no_evidence — threshold gate (best chunk exceeds cosine-distance)
// PLACEHOLDER: NO_EVIDENCE_THRESHOLD = 0.7 is UNJUSTIFIED.
// This must be tuned against the 5-repo eval corpus before the feature
// is considered complete.
// Strategy: wipe real chunks and insert a deliberately distant vector.
// ===========================================================================
describe("POST /api/repositories/:id/chat — no_evidence (threshold gate)", () => {
  it("returns no_evidence without generation when the top chunk distance > threshold", async () => {
    const { repositoryId } = await seedRepo();

    const [f] = await db.select().from(files).where(eq(files.repositoryId, repositoryId));
    expect(f).toBeDefined();

    await db.execute(
      sql`DELETE FROM ${ecTable} WHERE repository_id = ${repositoryId}`
    );

    const farVector = new Array(384).fill(0).map((_, i) =>
      i % 2 === 0 ? 0.42 : -0.41
    );

    await db.insert(ecTable).values({
      fileId: f!.id,
      repositoryId,
      startLine: 1,
      endLine: 10,
      embedding: farVector,
    });

    const { resp, body } = await makeChatRequest(repositoryId, {
      question: "where is authentication handled?",
    });

    expect(resp.status).toBe(200);
    expect(body.status).toBe("no_evidence");
    expect(body.citations).toEqual([]);
    // Threshold short-circuit means NO generation call was made.
    expect(genaictx.genRespCount).toBe(0);
  });
});

// ===========================================================================
// E2E: generation failure → 502 (distinct from no_evidence / off_topic)
// ===========================================================================
describe("POST /api/repositories/:id/chat — generation failure → 502", () => {
  it("maps a 429 quota error from Gemini to 502", async () => {
    const { repositoryId } = await seedRepo();
    await disableNoEvidenceThreshold();

    setGenaiReject(429, "RESOURCE_EXHAUSTED — quota exceeded");

    const { resp, body } = await makeChatRequest(repositoryId, {
      question: "Where is express imported?",
    });
    expect(resp.status).toBe(502);
    expect(body.error).toBe("Generation provider error");
    // A 502 is a failure — distinct from 200 no_evidence / off_topic
  });

  it("maps a 503 ServiceUnavailable from Gemini to 502", async () => {
    const { repositoryId } = await seedRepo();
    await disableNoEvidenceThreshold();

    setGenaiReject(503, "SERVICE_UNAVAILABLE");

    const { resp, body } = await makeChatRequest(repositoryId, {
      question: "Where is express imported?",
    });
    expect(resp.status).toBe(502);
    expect(body.error).toBe("Generation provider error");
  });
});

// ===========================================================================
// E2E: malformed JSON from Gemini → 502 (JSON-mode can still fail)
// ===========================================================================
describe("POST /api/repositories/:id/chat — malformed JSON response → 502", () => {
  it("returns 502 when the model returns non-JSON text instead of crashing", async () => {
    const { repositoryId } = await seedRepo();
    await disableNoEvidenceThreshold();

    setGenaiAnswer("I'm sorry, I cannot answer that question.");

    const { resp, body } = await makeChatRequest(repositoryId, {
      question: "Where is express imported?",
    });
    expect(resp.status).toBe(502);
    expect(body.error).toBe("Generation provider error");
  });
});

// ===========================================================================
// E2E: syntactically-valid JSON but wrong shape → 502 (json_object mode
// guarantees valid JSON syntax but NOT schema compliance)
// ===========================================================================
describe("POST /api/repositories/:id/chat — valid JSON, wrong shape → 502", () => {
  it("returns 502 when the model returns schema-compliant JSON without a status field", async () => {
    const { repositoryId } = await seedRepo();
    await disableNoEvidenceThreshold();

    setGenaiAnswer('{"answer":"Express is imported on line 1.","citations":[1]}');

    const { resp, body } = await makeChatRequest(repositoryId, {
      question: "Where is express imported?",
    });
    expect(resp.status).toBe(502);
    expect(body.error).toBe("Generation provider error");
  });

  it("returns 502 when the model returns an unexpected status value", async () => {
    const { repositoryId } = await seedRepo();
    await disableNoEvidenceThreshold();

    setGenaiAnswer('{"status":"bogus","answer":"N/A","citations":[]}');

    const { resp, body } = await makeChatRequest(repositoryId, {
      question: "Where is express imported?",
    });
    expect(resp.status).toBe(502);
    expect(body.error).toBe("Generation provider error");
  });
});

// ===========================================================================
// E2E: successful answered response with valid citations
// ===========================================================================
describe("POST /api/repositories/:id/chat — answered with valid citations", () => {
  it("returns status=answered with resolved citations", async () => {
    const { repositoryId, fileId } = await seedRepo();
    await disableNoEvidenceThreshold();

    setGenaiAnswer(
      '{"status":"answered","answer":"Express is imported on line 1 from the express package.","citations":[1]}'
    );

    const { resp, body } = await makeChatRequest(repositoryId, {
      question: "Where is express imported?",
    });
    expect(resp.status).toBe(200);
    expect(body.status).toBe("answered");
    expect(body.answer).toBeTruthy();
    expect(body.citations).toHaveLength(1);
    expect(body.citations[0].fileId).toBe(fileId);
    expect(body.citations[0].startLine).toBe(4);
    expect(body.citations[0].endLine).toBe(7);
  });
});

// ===========================================================================
// E2E: generation failure → 502 via the Groq SDK error shape
// Groq surfaces errors with e.status (not e.statusCode). The chat.ts catch
// block normalises (e.status ?? e.statusCode ?? 500) to 502 with a fresh
// Error, and the route returns 502 with "Generation provider error".
// ===========================================================================
describe("POST /api/repositories/:id/chat — Groq error shape → 502", () => {
  it("maps a Groq-style 404 (invalid model, e.status=404) to 502 — not 500", async () => {
    const { repositoryId } = await seedRepo();
    await disableNoEvidenceThreshold();

    setGenaiReject(404, "Not Found: model does not exist");

    const { resp, body } = await makeChatRequest(repositoryId, {
      question: "Where is express imported?",
    });
    expect(resp.status).toBe(502);
    expect(body.error).toBe("Generation provider error");
  });

  it("maps a Groq-style 429 (e.status=429, e.statusCode absent) to 502 via e.status fallback", async () => {
    const { repositoryId } = await seedRepo();
    await disableNoEvidenceThreshold();

    setGenaiReject(429, "RESOURCE_EXHAUSTED");

    const { resp, body } = await makeChatRequest(repositoryId, {
      question: "Where is express imported?",
    });
    expect(resp.status).toBe(502);
    expect(body.error).toBe("Generation provider error");
  });

  it("normalises a 500 provider error to 502 (consistent treatment of all GenAI failures)", async () => {
    const { repositoryId } = await seedRepo();
    await disableNoEvidenceThreshold();

    setGenaiReject(500, "INTERNAL — Groq server error");

    const { resp, body } = await makeChatRequest(repositoryId, {
      question: "Where is express imported?",
    });
    expect(resp.status).toBe(502);
    expect(body.error).toBe("Generation provider error");
  });
});
