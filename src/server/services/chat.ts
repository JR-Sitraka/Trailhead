import { db } from "@/server/db";
import { embeddingChunks, files } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { generateEmbeddings } from "./embeddings";
import { generateJson } from "./generation";

export interface ChatRequest {
  question: string;
  history: Array<{ question: string; answer: string | null; citations: Array<{ fileId: string; path: string; startLine: number; endLine: number }> }>;
}

export interface ChatCitation {
  fileId: string;
  path: string;
  startLine: number;
  endLine: number;
  label: number;
}

export interface InlineCitationSegment {
  type: "text";
  content: string;
}

export interface InlineCitationMarker {
  type: "citation";
  label: number;
  citation: ChatCitation;
}

export type InlineCitationSegmentOrMarker = InlineCitationSegment | InlineCitationMarker;

export function parseInlineCitations(
  answer: string,
  labelToCitation: Map<number, ChatCitation>
): InlineCitationSegmentOrMarker[] {
  const segments: InlineCitationSegmentOrMarker[] = [];
  const regex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(answer)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: answer.slice(lastIndex, match.index) });
    }
    const label = parseInt(match[1], 10);
    const citation = labelToCitation.get(label);
    if (citation) {
      segments.push({ type: "citation", label, citation });
    } else {
      segments.push({ type: "text", content: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < answer.length) {
    segments.push({ type: "text", content: answer.slice(lastIndex) });
  }

  return segments;
}

export const RETRIEVAL_K = 8;

export const NO_EVIDENCE_THRESHOLD = 0.75;
// Evidence-informed threshold: raised from 0.7 to 0.75 after real retrieval
// reproduction on sindresorhus/escape-string-regexp showed the closest match
// for "which programming language" at 0.7216 (genuinely relevant) with the
// next candidate at 0.7874, a 0.0658 gap. Not comprehensively validated
// across the full 5-repo eval corpus ask.md requires — treat as tuned but
// still open to broader calibration.
let noEvidenceThresholdOverride: number | null = null;

export function setNoEvidenceThresholdOverride(value: number | null) {
  noEvidenceThresholdOverride = value;
}

function getNoEvidenceThreshold(): number {
  return noEvidenceThresholdOverride ?? NO_EVIDENCE_THRESHOLD;
}

export function validateQuestion(question: string): void {
  const trimmed = question.trim();
  if (!trimmed) {
    throw new Error("Question is required");
  }
  if (trimmed.length > 500) {
    throw new Error("Question must be at most 500 characters");
  }
}

export function validateAnswerLabels(citations: number[], K: number, retrievedIds: string[]): boolean {
  if (!Array.isArray(citations) || citations.length === 0) {
    return true;
  }

  if (K !== retrievedIds.length) {
    return false;
  }

  const validLabels = new Set<number>();
  for (let i = 1; i <= K; i++) validLabels.add(i);

  for (const label of citations) {
    if (!Number.isInteger(label) || label < 1 || label > K) {
      return false;
    }
  }

  return true;
}

function formatVectorForQuery(embedding: number[]): string {
  return `[${embedding.map(v => Number(v.toFixed(6))).join(",")}]`;
}

export async function embedQuestion(question: string): Promise<number[]> {
  const [vec] = await generateEmbeddings([question]);
  return vec;
}

export async function retrieveChunks(
  questionEmbedding: number[],
  repositoryId: string,
  K = RETRIEVAL_K
): Promise<Array<{ id: string; fileId: string; startLine: number; endLine: number; cosineDistance: number }>> {
  const vectorStr = formatVectorForQuery(questionEmbedding);

  const rows = await db.execute(
    sql`
      SELECT id, file_id, start_line, end_line, cosine_distance(embedding, ${vectorStr}::vector) AS cosine_distance
      FROM ${embeddingChunks}
      WHERE repository_id = ${repositoryId}
      ORDER BY cosine_distance ASC, id ASC
      LIMIT ${K}
    `
  );

  return rows.map(r => ({
    id: r.id as string,
    fileId: r.file_id as string,
    startLine: r.start_line as number,
    endLine: r.end_line as number,
    cosineDistance: r.cosine_distance as number,
  }));
}

async function reSliceChunkText(fileId: string, startLine: number, endLine: number): Promise<string> {
  const [fileRow] = await db.select().from(files).where(eq(files.id, fileId));
  if (!fileRow || !fileRow.content) {
    return "";
  }

  const lines = fileRow.content.split("\n");
  const start = Math.max(startLine - 1, 0);
  const end = Math.min(endLine, lines.length);
  return lines.slice(start, end).join("\n");
}

export async function generateAnswer(
  question: string,
  chunks: Array<{ id: string; fileId: string; startLine: number; endLine: number }>,
  history: ChatRequest["history"]
): Promise<{ status: "answered" | "off_topic" | "no_evidence"; answer: string; citations: number[] }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { status: "no_evidence", answer: "Generation not configured: GROQ_API_KEY is missing.", citations: [] };
  }

  const chunksWithText = await Promise.all(
    chunks.map(async (chunk) => {
      const text = await reSliceChunkText(chunk.fileId, chunk.startLine, chunk.endLine);
      return { ...chunk, text };
    })
  );

  const labeledEvidence = chunksWithText
    .map((chunk, i) => `[CHUNK ${i + 1}] file=${chunk.fileId} lines ${chunk.startLine}-${chunk.endLine}:\n${chunk.text}`)
    .join("\n\n");

  const historySection = history.length > 0
    ? "\n\nConversation history (for context only; answer the user's most recent question):\n" +
      history.map((turn, i) => `Turn ${i + 1}:\nQ: ${turn.question}\nA: ${turn.answer ?? "(no answer)"}\n`).join("\n")
    : "";

  const prompt =
    `You are a strict Q&A assistant for a code repository. Answer ONLY from the provided evidence chunks below. ` +
    `Place each citation label in square brackets IMMEDIATELY after the relevant claim in your prose. ` +
    `Do NOT collect citations into a separate list at the end. Every bracket label that appears in your answer text MUST also appear in the citations array. ` +
    `The labels are 1-indexed mapping to the chunks in order.\n\n` +
    `Respond with JSON in exactly this shape:\n` +
    `{ "status": "answered", "answer": "<your prose answer with inline bracket citations>", "citations": [<integer labels of chunks you cited>] }\n` +
    `OR, if the question is unrelated to the evidence: { "status": "off_topic", "answer": "<explanation>", "citations": [] }\n` +
    `OR, if the question cannot be answered from the evidence despite being on-topic: ` +
    `{ "status": "no_evidence", "answer": "<explanation>", "citations": [] }\n\n` +
    `Evidence chunks:\n${labeledEvidence}${historySection}\n\nQuestion: ${question}\n\nRespond now with only a JSON object.`;

  try {
    // Routed through the shared generation abstraction — the single choke
    // point that records every request for observability (Upgrade item 5).
    const chatResponse = (await generateJson(prompt)) as any;
    const rawText = chatResponse.choices?.[0]?.message?.content;
    if (typeof rawText !== "string" || !rawText.trim()) {
      const err: any = new Error("Generation returned empty response text");
      err.status = 502;
      throw err;
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText) as {
        status: "answered" | "off_topic" | "no_evidence";
        answer: string;
        citations: number[];
      };
    } catch {
      const err: any = new Error("Generation returned invalid JSON");
      err.status = 502;
      throw err;
    }

    if (!parsed || !["answered", "off_topic", "no_evidence"].includes(parsed.status)) {
      const err: any = new Error("Generation returned malformed payload");
      err.status = 502;
      throw err;
    }

    return {
      status: parsed.status,
      answer: parsed.answer ?? "",
      citations: parsed.citations ?? [],
    };
  } catch (e: any) {
    const status = (e.status ?? e.statusCode ?? 500) as number;
    const err: any = new Error(e.message ?? "Generation provider error");
    err.status = 502;
    throw err;
  }
}

export async function processChatQuestion(
  question: string,
  history: ChatRequest["history"],
  repositoryId: string
): Promise<{ status: "answered" | "no_evidence" | "off_topic"; answer?: string; citations?: ChatCitation[] }> {
  const trimmed = question.trim();
  validateQuestion(trimmed);

  const embedding = await embedQuestion(question);
  const threshold = getNoEvidenceThreshold();
  const chunks = await retrieveChunks(embedding, repositoryId, RETRIEVAL_K);

  if (chunks.length === 0 || chunks[0].cosineDistance > threshold) {
    return { status: "no_evidence" };
  }

  const result = await generateAnswer(question, chunks, history);

  if (result.status !== "answered") {
    return { status: result.status, answer: result.answer ?? "", citations: [] };
  }

  const labelsValid = validateAnswerLabels(result.citations, chunks.length, chunks.map(c => c.id));
  if (!labelsValid) {
    return { status: "no_evidence" };
  }

  const citationMap = new Map(chunks.map((c, i) => [i + 1, c]));
  const resolvedCitations: { label: number; fileId: string; path: string; startLine: number; endLine: number }[] = [];
  for (const label of result.citations) {
    const c = citationMap.get(label);
    if (c) {
      resolvedCitations.push({
        label,
        fileId: c.fileId,
        path: "",
        startLine: c.startLine,
        endLine: c.endLine,
      });
    }
  }

  for (const citation of resolvedCitations) {
    const [fileRow] = await db.select({ path: files.path }).from(files).where(eq(files.id, citation.fileId));
    if (fileRow) citation.path = fileRow.path;
  }

  return {
    status: "answered",
    answer: result.answer,
    citations: resolvedCitations,
  };
}
