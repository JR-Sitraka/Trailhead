import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { repositories, analysisJobs, files } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repo = await db.select().from(repositories).where(eq(repositories.id, params.id)).then((r) => r[0]);
    if (!repo) return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    const job = await db.select().from(analysisJobs)
      .where(eq(analysisJobs.repositoryId, params.id))
      .orderBy(desc(analysisJobs.createdAt))
      .then((r) => r[0]);
    return NextResponse.json({ ...repo, analysisJob: job || null });
  } catch (error) {
    console.error("GET /api/repositories/:id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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
        { error: "Cannot delete repository while an analysis is in progress" },
        { status: 409 }
      );
    }

    await db.delete(repositories).where(eq(repositories.id, params.id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/repositories/:id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
