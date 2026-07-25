import { db } from '@/server/db';
import { repositories } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ChatClient from './ChatClient';

export default async function ChatPage({ params }: { params: { id: string } }) {
  const repo = await db
    .select()
    .from(repositories)
    .where(eq(repositories.id, params.id))
    .then((r) => r[0]);

  if (!repo || repo.status !== 'ready') {
    notFound();
  }

  return <ChatClient repoId={repo.id} />;
}
