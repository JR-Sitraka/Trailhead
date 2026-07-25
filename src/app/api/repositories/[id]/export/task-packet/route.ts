import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { repositories } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getTaskPacket, validateTask } from "@/server/services/export";

export async function POST(
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { task } = body as Record<string, unknown>;
    if (typeof task !== "string") {
      return NextResponse.json({ error: "Missing required field: task (string)" }, { status: 400 });
    }

    try {
      validateTask(task);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    const results = await getTaskPacket(params.id, task);
    return NextResponse.json({ results });
  } catch (error: any) {
    if (error.message === "Repository not found") {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }
    console.error("[export/task-packet] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
