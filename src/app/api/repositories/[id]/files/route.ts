import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { repositories, files } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repo = await db.select().from(repositories).where(eq(repositories.id, params.id)).then((r) => r[0]);
    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    if (repo.status !== "ready") {
      return NextResponse.json(
        { error: "Repository is not ready. It must finish analysis before it can be queried." },
        { status: 409 }
      );
    }

    const rows = await db
      .select({
        id: files.id,
        path: files.path,
        size: files.size,
        language: files.language,
        skipped: files.skipped,
        skipReason: files.skipReason,
        category: files.category,
      })
      .from(files)
      .where(eq(files.repositoryId, params.id));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET /api/repositories/:id/files error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
