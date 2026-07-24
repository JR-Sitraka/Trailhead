import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { repositories, analysisJobs } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repo = await db.select().from(repositories).where(eq(repositories.id, params.id)).then((r) => r[0]);
    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    const latestJob = await db.select().from(analysisJobs)
      .where(eq(analysisJobs.repositoryId, params.id))
      .orderBy(desc(analysisJobs.createdAt))
      .then((r) => r[0]);

    if (latestJob && (latestJob.status === "queued" || latestJob.status === "running")) {
      return NextResponse.json(
        { error: "An analysis is already in progress for this repository" },
        { status: 409 }
      );
    }

    const [newJob] = await db.insert(analysisJobs).values({
      repositoryId: params.id,
      status: "queued",
      truncated: false,
      parsingCompletedAt: null,
      embeddingCompletedAt: null
    }).returning();

    return NextResponse.json(newJob, { status: 201 });
  } catch (error) {
    console.error("POST /api/repositories/:id/reanalyze error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
