import { db } from "@/server/db";
import { repositories, analysisJobs } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import WorkspaceHeader from "@/components/WorkspaceHeader";

export default async function RepoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  let repo: (typeof repositories.$inferSelect) | undefined;

  try {
    repo = await db
      .select()
      .from(repositories)
      .where(eq(repositories.id, params.id))
      .then((r) => r[0]);
  } catch {
    notFound();
  }

  if (!repo) {
    notFound();
  }

  let job: (typeof analysisJobs.$inferSelect) | undefined;

  try {
    job = await db
      .select()
      .from(analysisJobs)
      .where(eq(analysisJobs.repositoryId, params.id))
      .then((r) => r[0]);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <WorkspaceHeader
        repo={{
          id: repo.id,
          name: repo.name,
          commitSha: repo.commitSha,
          status: repo.status as "queued" | "analyzing" | "ready" | "failed",
        }}
      />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
