import { db } from '@/server/db';
import { repositories } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import WorkspaceHeader from '@/components/WorkspaceHeader';
import ExportClient from './ExportClient';

export default async function ExportPage({ params }: { params: { id: string } }) {
  const repo = await db
    .select()
    .from(repositories)
    .where(eq(repositories.id, params.id))
    .then((r) => r[0]);

  if (!repo) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-bg">
      <WorkspaceHeader repo={{
        id: repo.id,
        name: repo.name,
        commitSha: repo.commitSha,
        status: repo.status as 'queued' | 'analyzing' | 'ready' | 'failed',
      }} />
      <ExportClient repoId={repo.id} />
    </div>
  );
}
