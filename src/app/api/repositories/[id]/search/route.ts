import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { repositories } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { searchFiles } from "@/server/services/search";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const fileType = searchParams.get("fileType") || undefined;
    const pathPrefix = searchParams.get("pathPrefix") || undefined;

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Query parameter 'q' is required and must not be empty." }, { status: 400 });
    }

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

    const results = await searchFiles(params.id, query.trim(), fileType, pathPrefix);
    return NextResponse.json(results);
  } catch (error) {
    console.error("[search] GET /api/repositories/:id/search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}