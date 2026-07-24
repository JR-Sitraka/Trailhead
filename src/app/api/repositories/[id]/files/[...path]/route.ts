import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { repositories, files } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; path: string[] } }
) {
  try {
    const repo = await db
      .select()
      .from(repositories)
      .where(eq(repositories.id, params.id))
      .then((r) => r[0]);

    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    if (repo.status !== "ready") {
      return NextResponse.json(
        { error: "Repository is not ready. It must finish analysis before it can be queried." },
        { status: 409 }
      );
    }

    const filePath = decodeURIComponent(params.path.join("/"));

    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.repositoryId, params.id), eq(files.path, filePath)))
      .then((r) => r);

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (file.skipped) {
      return NextResponse.json(
        { error: "File was skipped during analysis", skipReason: file.skipReason },
        { status: 409 }
      );
    }

    return NextResponse.json({
      id: file.id,
      path: file.path,
      content: file.content,
      language: file.language,
      size: file.size,
    });
  } catch (error) {
    console.error("[files] GET /:id/files/... error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
