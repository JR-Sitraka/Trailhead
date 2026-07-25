import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { repositories } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getExportJson } from "@/server/services/export";

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
        { error: "Repository is not ready. It must finish analysis before it can be exported." },
        { status: 409 }
      );
    }

    const data = await getExportJson(params.id);
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === "Repository not found") {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }
    console.error("[export/json] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
