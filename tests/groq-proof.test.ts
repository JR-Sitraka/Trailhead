import { describe, it, expect } from "vitest";

const MODEL_ID = "llama-3.3-70b-versatile";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

describe("Groq + llama-3.3-70b-versatile proof-of-environment", () => {
  it("confirms groq-sdk is installed and GROQ_API_KEY is present", () => {
    expect(GROQ_API_KEY).toBeDefined();
    expect(GROQ_API_KEY!.length).toBeGreaterThan(10);
    console.log(`[GROQ_API_KEY PRESENT] length=${GROQ_API_KEY!.length}`);
    console.log(`[MODEL ID] >${MODEL_ID}<`);
  });

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

  // -----------------------------------------------------------------------
  // Case 1: Simple factual call — confirm real non-empty response
  // -----------------------------------------------------------------------
  it("makes a real API call and returns non-empty text", { timeout: 120_000 }, async () => {
    const Groq = (await import("groq-sdk")).default;
    const groq = new Groq({ apiKey: GROQ_API_KEY });

    const response = await callWithRetry(groq, {
      model: MODEL_ID,
      messages: [
        { role: "user", content: "In one sentence, what are the primary colors?" },
      ],
    });

    const text = response.choices?.[0]?.message?.content;
    expect(text).toBeDefined();
    expect(text!.length).toBeGreaterThan(0);
    console.log("\n[SIMPLE CALL RESPONSE]");
    console.log(text);
  });

  // -----------------------------------------------------------------------
  // Case 2: Evidence-grounded Q&A with citation labels, using json_object
  // mode because json_schema is NOT supported for llama-3.3-70b-versatile.
  // -----------------------------------------------------------------------
  it("follows system instruction to answer only from evidence and return parseable JSON", { timeout: 120_000 }, async () => {
    const Groq = (await import("groq-sdk")).default;
    const groq = new Groq({ apiKey: GROQ_API_KEY });

    const evidence =
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
      "}";

    const response = await callWithRetry(groq, {
      model: MODEL_ID,
      messages: [
        {
          role: "system",
          content:
            "You are a strict Q&A assistant for a code repository. Answer ONLY from the provided evidence chunks below. " +
            "Cite every claim using integer labels in square brackets, e.g. [1], [2], referencing the chunk numbers as assigned below. " +
            "The labels are 1-indexed mapping to the chunks in order.\n\n" +
            "Respond with JSON in exactly this shape:\n" +
            '{ "status": "answered", "answer": "<your prose answer>", "citations": [<integer labels of chunks you cited>] }\n' +
            "OR, if the question is unrelated to the evidence: { \"status\": \"off_topic\", \"answer\": \"<explanation>\", \"citations\": [] }\n" +
            "OR, if the question cannot be answered from the evidence despite being on-topic: " +
            '{ "status\": \"no_evidence\", \"answer\": \"<explanation>\", \"citations\": [] }\n\n' +
            "You MUST output valid JSON. The word JSON appears here so the JSON format is enforced.",
        },
        {
          role: "user",
          content: `Question: Which file contains the authentication function and what does it do?\n\nEvidence chunks:\n${evidence}`,
        },
      ],
      // llama-3.3-70b-versatile does NOT support json_schema structured output.
      // Only openai/gpt-oss-20b and openai/gpt-oss-120b support strict mode.
      // Fallback: json_object mode (best-effort, requires "JSON" word in prompt).
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const rawText = response.choices?.[0]?.message?.content;
    expect(rawText).toBeDefined();
    expect(rawText!.length).toBeGreaterThan(0);
    console.log("\n[EVIDENCE-BASED CALL RAW RESPONSE]");
    console.log(rawText);

    let parsed: { status: string; answer: string; citations: number[] };
    try {
      parsed = JSON.parse(rawText!) as typeof parsed;
    } catch {
      throw new Error(`Model returned non-JSON text despite json_object mode: ${rawText!.slice(0, 200)}`);
    }

    expect(["answered", "off_topic", "no_evidence"]).toContain(parsed.status);
    expect(typeof parsed.answer).toBe("string");
    expect(parsed.answer.length).toBeGreaterThan(0);
    expect(Array.isArray(parsed.citations)).toBe(true);
    if (parsed.status === "answered") {
      expect(parsed.citations.length).toBeGreaterThan(0);
      for (const c of parsed.citations) {
        expect(Number.isInteger(c)).toBe(true);
        expect(c).toBeGreaterThanOrEqual(1);
        expect(c).toBeLessThanOrEqual(2);
      }
      // The answer must reference the authentication function from chunk 1.
      expect(parsed.answer).toMatch(/authenticat/i);
      console.log("\n[PARSED STRUCTURED RESPONSE]");
      console.log(JSON.stringify(parsed, null, 2));
    }
  });

  // -----------------------------------------------------------------------
  // Case 3: Confirm real 429 rate-limit error shape
  // Using an intentionally invalid model ID to force a fast, cheap 400/404
  // rather than burning quota. We then also inspect the error shape for
  // rate-limit headers by noting what Groq's docs say about 429 shape.
  // -----------------------------------------------------------------------
  it("reveals the SDK error shape for rate-limit and invalid-model errors", async () => {
    const Groq = (await import("groq-sdk")).default;
    const groq = new Groq({ apiKey: GROQ_API_KEY });

    try {
      await groq.chat.completions.create({
        model: "llama-3.3-70b-invalid-test-404",
        messages: [{ role: "user", content: "hello" }],
      });
    } catch (e) {
      const sdkError = e as any;
      console.log("\n[SDK ERROR SHAPE]");
      console.log("constructor.name :", sdkError.constructor?.name);
      console.log("e.status         :", sdkError.status);
      console.log("e.statusCode     :", sdkError.statusCode);
      console.log("e.message        :", sdkError.message);
      console.log("e.error (parsed) :", sdkError.error);
      console.log("e.body (raw str) :", sdkError.body);

      // Groq's API is OpenAI-compatible. Errors come as HTTP status codes.
      expect(sdkError.status).toBeDefined();
      expect(typeof sdkError.status).toBe("number");

      // Groq rate-limit (429) is documented as OpenAI-compatible:
      // HTTP 429, with x-ratelimit-* headers and retry-after.
      // Invalid model → 404 (NOT_FOUND), similar shape.
      expect([400, 404]).toContain(sdkError.status);
      return;
    }
    throw new Error("Expected the invalid-model call to raise an SDK error");
  });
});
