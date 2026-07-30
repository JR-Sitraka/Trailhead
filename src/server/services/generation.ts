import Groq from "groq-sdk";
import { db } from "@/server/db";
import { llmRequestLogs } from "@/server/db/schema";

/**
 * Shared generation abstraction — the single choke point for every LLM
 * generation request the system makes (Chat turns and Export's
 * REPOSITORY_CONTEXT.md summary).
 *
 * Both callers previously instantiated `new Groq(...)` and called
 * `chat.completions.create(...)` independently, with duplicated model
 * constants. `observability.md` and `architecture.md` both describe this
 * abstraction as already existing ("the single choke point, so no path
 * can bypass it") — it did not. It does now, which is what makes the
 * counting guarantee in those documents actually true.
 */

/** Provider configuration. `providerName` is config, never hardcoded in the UI. */
export const GROQ_MODEL = "llama-3.3-70b-versatile";
export const PROVIDER_NAME = "Groq";

/**
 * Records one generation request outcome.
 *
 * A failed write is logged and swallowed — counting must never break
 * generation (observability.md's NFR). Undercounting is possible and
 * accepted, stated honestly rather than hidden.
 */
async function recordOutcome(outcome: "success" | "failure"): Promise<void> {
  try {
    await db.insert(llmRequestLogs).values({ outcome, provider: PROVIDER_NAME });
  } catch (err) {
    console.error("[observability] LlmRequestLog write failed; generation unaffected:", err);
  }
}

/**
 * Performs one JSON-mode generation request and records its outcome.
 *
 * Outcome boundary (deliberate): `success` means the provider call itself
 * returned; `failure` means the provider call threw (network, auth, rate
 * limit, provider error). Downstream problems with the *content* of a
 * returned response — empty text, unparseable JSON, malformed payload —
 * are the caller's concern and are NOT counted as provider failures,
 * because `providerStatus` describes provider health, not model output
 * quality. Each caller keeps its own error handling unchanged: Chat
 * raises a 502, Export falls back to its deterministic summary.
 */
export async function generateJson(prompt: string): Promise<any> {
  const apiKey = process.env.GROQ_API_KEY;
  const ai = new Groq({ apiKey });

  let response: any;
  try {
    response = await ai.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });
  } catch (err) {
    await recordOutcome("failure");
    throw err;
  }

  await recordOutcome("success");
  return response;
}
