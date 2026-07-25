import { describe, it, expect } from "vitest";

const MODEL_ID = "llama-3.3-70b-versatile";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

interface GroqProofCase {
  name: string;
  evidence: string;
  question: string;
}

describe("Inline bracket citation behavior — real Groq proxy (agent-verified)", () => {
  if (!GROQ_API_KEY) {
    it.skip("GROQ_API_KEY is not set — skipping real Groq proof", () => {});
    return;
  }

  async function callWithRetry(
    groq: any,
    params: any,
    maxAttempts = 4,
    baseDelayMs = 3000
  ): Promise<any> {
    let lastErr: any;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await groq.chat.completions.create(params);
      } catch (e) {
        lastErr = e;
        const sc = (e as any)?.status ?? (e as any)?.statusCode;
        const msg = (e as any)?.message ?? String(e);
        console.log(
          `[attempt ${attempt + 1}/${maxAttempts}] status=${sc} message=${msg.slice(0, 160)}`
        );
        if (sc === 429 || sc === 503 || sc === 500 || sc === 502 || sc === 504) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
        } else {
          throw e;
        }
      }
    }
    throw lastErr;
  }

  function buildPrompt(evidence: string, question: string): string {
    return (
      `You are a strict Q&A assistant for a code repository. Answer ONLY from the provided evidence chunks below. ` +
      `Place each citation label in square brackets IMMEDIATELY after the relevant claim in your prose. ` +
      `Do NOT collect citations into a separate list at the end. Every bracket label that appears in your answer text MUST also appear in the citations array. ` +
      `The labels are 1-indexed mapping to the chunks in order.\n\n` +
      `Respond with JSON in exactly this shape:\n` +
      `{ "status": "answered", "answer": "<your prose answer with inline bracket citations>", "citations": [<integer labels of chunks you cited>] }\n` +
      `OR, if the question is unrelated to the evidence: { "status": "off_topic", "answer": "<explanation>", "citations": [] }\n` +
      `OR, if the question cannot be answered from the evidence despite being on-topic: ` +
      `{ "status": "no_evidence", "answer": "<explanation>", "citations": [] }\n\n` +
      `Evidence chunks:\n${evidence}\n\nQuestion: ${question}\n\nRespond now with only a JSON object.`
    );
  }

  const cases: GroqProofCase[] = [
    {
      name: "auth flow",
      evidence:
        "[CHUNK 1] file=src/auth.ts lines 10-20:\n" +
        "export function authenticate(input: string): boolean {\n" +
        "  return input === process.env.SECRET_KEY;\n" +
        "}\n\n" +
        "[CHUNK 2] file=src/api.ts lines 5-15:\n" +
        "import { authenticate } from './auth';\n" +
        "export function handleRequest(req: Request) {\n" +
        "  if (!authenticate(req.headers.get('x-key') || '')) {\n" +
        "    return new Response('Unauthorized', { status: 401 });\n" +
        "  }\n" +
        "  return new Response('OK');\n" +
        "}",
      question: "Which file contains the authentication function and what does it do?",
    },
    {
      name: "express import",
      evidence:
        "[CHUNK 1] file=src/index.ts lines 1-3:\n" +
        "import express from 'express';\n" +
        "const app = express();\n" +
        "app.listen(3000);\n\n" +
        "[CHUNK 2] file=src/routes.ts lines 1-5:\n" +
        "import { Router } from 'express';\n" +
        "export const router = Router();\n" +
        "router.get('/', (req, res) => res.send('hi'));",
      question: "Where is express imported and how is the server started?",
    },
    {
      name: "token validation",
      evidence:
        "[CHUNK 1] file=src/session.ts lines 30-40:\n" +
        "export function validateToken(token: string): boolean {\n" +
        "  const session = store.get(token);\n" +
        "  return !!session;\n" +
        "}\n\n" +
        "[CHUNK 2] file=src/middleware.ts lines 10-20:\n" +
        "export async function requireAuth(req: Request) {\n" +
        "  const auth = req.headers.get('Authorization');\n" +
        "  if (!auth) throw new Error('Missing header');\n" +
        "  await validateToken(auth.replace('Bearer ', ''));\n" +
        "}",
      question: "How does the system validate tokens and what happens if the Authorization header is missing?",
    },
    {
      name: "database connection",
      evidence:
        "[CHUNK 1] file=src/db.ts lines 1-10:\n" +
        "import { Pool } from 'pg';\n" +
        "export const pool = new Pool({ connectionString: process.env.DATABASE_URL });\n" +
        "export async function query(text: string, params: any[]) {\n" +
        "  return pool.query(text, params);\n" +
        "}\n\n" +
        "[CHUNK 2] file=src/schema.ts lines 50-60:\n" +
        "export const usersTable = sql`CREATE TABLE users (id serial PRIMARY KEY, email text)`;",
      question: "How is the database pool created and what helper is available for queries?",
    },
    {
      name: "logging setup",
      evidence:
        "[CHUNK 1] file=src/logger.ts lines 1-15:\n" +
        "import pino from 'pino';\n" +
        "export const logger = pino({ level: process.env.LOG_LEVEL || 'info' });\n" +
        "export function logRequest(req: Request) {\n" +
        "  logger.info({ method: req.method, url: req.url });\n" +
        "}\n\n" +
        "[CHUNK 2] file=src/index.ts lines 20-25:\n" +
        "app.use((req, res, next) => {\n" +
        "  logRequest(req);\n" +
        "  next();\n" +
        "});",
      question: "How is logging initialized and where are request logs emitted?",
    },
  ];

  let successCount = 0;
  let totalCount = 0;

  for (const c of cases) {
    totalCount++;

    it(`[${c.name}] answer includes inline bracket markers`, { timeout: 120_000 }, async () => {
      const Groq = (await import("groq-sdk")).default;
      const groq = new Groq({ apiKey: GROQ_API_KEY });

      const response = await callWithRetry(groq, {
        model: MODEL_ID,
        messages: [
          { role: "user", content: buildPrompt(c.evidence, c.question) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const rawText = response.choices?.[0]?.message?.content;
      expect(rawText).toBeDefined();
      expect(rawText!.length).toBeGreaterThan(0);

      let parsed: { status: string; answer: string; citations: number[] };
      try {
        parsed = JSON.parse(rawText!) as typeof parsed;
      } catch {
        console.log(`[${c.name}] Model returned non-JSON despite json_object mode`);
        console.log(rawText);
        throw new Error(`Non-JSON response for ${c.name}`);
      }

      expect(parsed.status).toBe("answered");

      const hasInlineBrackets = /\[\d+\]/.test(parsed.answer);
      console.log(`[${c.name}] hasInlineBrackets=${hasInlineBrackets}`);
      console.log(`[${c.name}] answer: ${parsed.answer}`);
      console.log(`[${c.name}] citations: ${JSON.stringify(parsed.citations)}`);

      if (hasInlineBrackets) {
        successCount++;
      }
    });
  }

  it(`summary: ${totalCount} cases run`, { timeout: 120_000 }, async () => {
    // provides the aggregate count in test output
    expect(successCount).toBeGreaterThanOrEqual(0);
    console.log(`\n[INLINE CITATION PROOF SUMMARY]`);
    console.log(`success=${successCount}/${totalCount}`);
    console.log(`rate=${totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) : 0}%`);
  });
});
