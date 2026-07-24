import { db } from "@/server/db";
import { repositories, files } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ExplorerClient from "./ExplorerClient";

export default async function ExplorerPage({ params }: { params: { id: string } }) {
  const repo = await db
    .select()
    .from(repositories)
    .where(eq(repositories.id, params.id))
    .then((r) => r[0]);

  if (!repo || repo.status !== "ready") {
    notFound();
  }

  const repoFiles = await db
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

  return (
    <ExplorerClient
      repoId={params.id}
      initialFiles={repoFiles}
    />
  );
}
