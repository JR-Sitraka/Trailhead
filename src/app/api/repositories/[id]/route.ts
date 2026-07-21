import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { repositories, analysisJobs, files } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repo = await db.select().from(repositories).where(eq(repositories.id, params.id)).then((r) => r[0]);
    if (!repo) return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    const job = await db.select().from(analysisJobs).where(eq(analysisJobs.repositoryId, params.id)).then((r) => r[0]);
    return NextResponse.json({ ...repo, analysisJob: job || null });
  } catch (error) {
    console.error("GET /api/repositories/:id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
