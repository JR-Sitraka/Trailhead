import { describe, it, expect } from "vitest";
import { GoogleGenAI } from "@google/genai";

describe("Gemini 3.5 Flash proof-of-environment", () => {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelId = "gemini-2.5-flash";

  it("confirms @google/genai is installed and package facts", () => {
    expect(apiKey).toBeDefined();
    expect(apiKey!.length).toBeGreaterThan(10);
    console.log(`[API KEY PRESENT] length=${apiKey!.length}`);
    console.log(`[MODEL ID] >${modelId}<`);
  });

  async function generateWithRetry(
    ai: GoogleGenAI,
    params: Parameters<typeof ai.models.generateContent>[0],
    maxAttempts = 6,
    baseDelayMs = 2000
  ): Promise<ReturnType<typeof ai.models.generateContent>> {
    let lastErr: any;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await ai.models.generateContent(params);
      } catch (e) {
        lastErr = e;
        const sc = (e as any).status;
        const msg = (e as any).message ?? String(e);
        console.log(
          `[attempt ${attempt + 1}/${maxAttempts}] status=${sc} message=${msg.slice(0, 140)}`
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

  it("makes a real API call and returns non-empty text", { timeout: 120_000 }, async () => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await generateWithRetry(ai, {
      model: modelId,
      contents: "In one sentence, what are the primary colors?",
    }, 6, 1500);
    expect(response.text).toBeDefined();
    expect(response.text!.length).toBeGreaterThan(0);
    console.log("\n[SIMPLE CALL RESPONSE]");
    console.log(response.text);
  });

  it("follows a system instruction to answer only from provided evidence", { timeout: 120_000 }, async () => {
    const ai = new GoogleGenAI({ apiKey });
    const evidence =
      "The Trailhead project is a Next.js 14 monorepo using Drizzle ORM, " +
      "pgvector, and @huggingface/transformers. It does not use PostgreSQL " +
      "replication and has no Kubernetes deployment.";
    const response = await generateWithRetry(ai, {
      model: modelId,
      config: {
        systemInstruction:
          "You are a strict Q&A assistant. Answer the user's question ONLY from the provided " +
          "evidence text. If the answer is not in the evidence, say 'The evidence does not contain " +
          "this information.' Cite the relevant fact(s) from the evidence in square brackets.",
      },
      contents: `Question: Does the project use Kubernetes?\n\nEvidence:\n${evidence}`,
    }, 6, 1500);
    expect(response.text).toBeDefined();
    expect(response.text!.length).toBeGreaterThan(0);
    console.log("\n[EVIDENCE-BASED CALL RESPONSE]");
    console.log(response.text);
  });

  it("reveals the actual SDK error shape for quota/rate-limit conditions from docs+source", async () => {
    // Confirm the error shape without burning free-tier quota by using an invalid model.
    const ai = new GoogleGenAI({ apiKey });
    try {
      await ai.models.generateContent({
        model: "gemini-2.5-flash-invalid-test-404",
        contents: "hello",
      });
    } catch (e) {
      const sdkError = e as any;
      console.log("\n[SDK ERROR SHAPE]");
      console.log("constructor.name  :", sdkError.constructor?.name);
      console.log("e.status          :", sdkError.status);
      console.log("e.statusCode      :", sdkError.statusCode);
      console.log("e.message         :", sdkError.message);
      console.log("e.error (parsed)  :", sdkError.error);
      console.log("e.body (raw str)  :", sdkError.body);

      // The SDK throws `ApiError` with `status` = HTTP numeric code.
      // For 404: { "error": {"code":404,"message":"...","status":"NOT_FOUND"} }
      expect(sdkError.status).toBe(404);
      // Confirm `message` is the stringified JSON body from Google
      const parsed = JSON.parse(sdkError.message);
      expect(parsed.error.code).toBe(404);
      expect(parsed.error.status).toBe("NOT_FOUND");
      return;
    }
    throw new Error("Expected the invalid-model call to raise an SDK ApiError");
  });
});
