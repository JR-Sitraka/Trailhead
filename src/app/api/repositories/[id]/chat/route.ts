import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { repositories, embeddingChunks, files } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { processChatQuestion, validateQuestion } from "@/server/services/chat";

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
        { error: "Repository is not ready. It must finish analysis before it can be queried." },
        { status: 409 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { question, history } = body as Record<string, unknown>;
    if (typeof question !== "string") {
      return NextResponse.json({ error: "Missing required field: question (string)" }, { status: 400 });
    }

    const resolvedHistory: Array<{ question: string; answer: string | null; citations: Array<{ fileId: string; path: string; startLine: number; endLine: number }> }> = Array.isArray(history) ? history : [];

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }
    if (trimmedQuestion.length > 500) {
      return NextResponse.json({ error: "Question must be at most 500 characters" }, { status: 400 });
    }

    if (resolvedHistory.length > 0) {
      return NextResponse.json(
        { error: "Non-empty history is not supported in this slice. Send an empty array." },
        { status: 422 }
      );
    }

    try {
      const result = await processChatQuestion(question, resolvedHistory, repo.id);

      if (result.status === "answered") {
        return NextResponse.json({
          status: result.status,
          answer: result.answer ?? "",
          citations: result.citations ?? [],
        });
      }
      return NextResponse.json({
        status: result.status,
        answer: result.answer ?? "",
        citations: [],
      });
    } catch (e: any) {
      const httpStatus = e.status ?? e.statusCode ?? 500;
      if ([429, 500, 502, 503, 504].includes(httpStatus)) {
        return NextResponse.json({ error: "Generation provider error", details: e.message }, { status: 502 });
      }
      console.error("[chat] unexpected generation error:", e);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  } catch (e: any) {
    console.error("[chat] unexpected route error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
