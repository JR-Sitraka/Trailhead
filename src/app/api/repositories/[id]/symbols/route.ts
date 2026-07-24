import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { repositories, symbols, files } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

const VALID_KINDS = ["function", "class", "interface", "import", "export"] as const;

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

    const kind = request.nextUrl.searchParams.get("kind");
    if (kind !== null && !VALID_KINDS.includes(kind as typeof VALID_KINDS[number])) {
      return NextResponse.json(
        { error: `Invalid kind. Must be one of: ${VALID_KINDS.join(", ")}` },
        { status: 400 }
      );
    }

    const baseCondition = eq(files.repositoryId, params.id);
    const kindCondition = kind !== null
      ? eq(symbols.kind, kind as typeof VALID_KINDS[number])
      : undefined;

    const rows = await db
      .select({
        id: symbols.id,
        kind: symbols.kind,
        name: symbols.name,
        path: files.path,
        startLine: symbols.startLine,
        endLine: symbols.endLine,
      })
      .from(symbols)
      .innerJoin(files, eq(symbols.fileId, files.id))
      .where(kindCondition ? and(baseCondition, kindCondition) : baseCondition);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("[symbols] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
