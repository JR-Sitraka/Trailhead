import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { llmRequestLogs } from "@/server/db/schema";
import { gte, sql, desc } from "drizzle-orm";
import { PROVIDER_NAME } from "@/server/services/generation";

export const dynamic = "force-dynamic";

export type ProviderStatus = "operational" | "erroring" | "unknown";

export interface ObservabilityResponse {
  requests: number;
  failures: number;
  providerStatus: ProviderStatus;
  providerName: string;
}

/** Start of the current UTC calendar day — "today" matches how free-tier quotas reset. */
function startOfUtcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * GET /api/observability
 *
 * Read-only, no parameters, no auth (consistent project-wide). Derived
 * entirely from LlmRequestLog + config. Unknown query params are ignored.
 *
 * Provider status is derived from observed evidence only — the latest
 * request observed today. No synthetic health-check call is ever made:
 * it would spend real quota to ask whether we are spending quota.
 */
export async function GET() {
  try {
    const dayStart = startOfUtcDay(new Date());

    const [counts] = await db
      .select({
        requests: sql<number>`count(*)::int`,
        failures: sql<number>`count(*) filter (where ${llmRequestLogs.outcome} = 'failure')::int`,
      })
      .from(llmRequestLogs)
      .where(gte(llmRequestLogs.createdAt, dayStart));

    const [latest] = await db
      .select({ outcome: llmRequestLogs.outcome })
      .from(llmRequestLogs)
      .where(gte(llmRequestLogs.createdAt, dayStart))
      .orderBy(desc(llmRequestLogs.createdAt))
      .limit(1);

    // No request observed today → 'unknown'. The panel never claims
    // unobserved health (approved zero-state decision).
    const providerStatus: ProviderStatus = !latest
      ? "unknown"
      : latest.outcome === "success"
        ? "operational"
        : "erroring";

    const body: ObservabilityResponse = {
      requests: counts?.requests ?? 0,
      failures: counts?.failures ?? 0,
      providerStatus,
      providerName: PROVIDER_NAME,
    };

    return NextResponse.json(body);
  } catch (error) {
    console.error("[observability] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
