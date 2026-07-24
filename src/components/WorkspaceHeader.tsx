'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Status = 'queued' | 'analyzing' | 'ready' | 'failed';

const STATUS_COLORS: Record<Status, string> = {
  queued: 'bg-text-muted',
  analyzing: 'bg-primary',
  ready: 'bg-success',
  failed: 'bg-danger',
};

const STATUS_LABELS: Record<Status, string> = {
  queued: 'Queued',
  analyzing: 'Analyzing',
  ready: 'Ready',
  failed: 'Failed',
};

const TABS = [
  { name: 'Overview', path: 'overview' },
  { name: 'Explorer', path: 'explorer' },
  { name: 'Symbols', path: 'symbols' },
  { name: 'Search', path: 'search' },
  { name: 'Chat', path: 'chat' },
  { name: 'Export', path: 'export' },
];

type Repo = {
  id: string;
  name: string;
  commitSha: string | null;
  status: Status;
};

export default function WorkspaceHeader({ repo }: { repo: Repo }) {
  const pathname = usePathname();
  const segments = pathname.split('/');
  const currentSegment = segments[segments.length - 1];
  const activeTab = TABS.some((t) => t.path === currentSegment) ? currentSegment : 'overview';

  const displaySha = repo.commitSha ? repo.commitSha.slice(0, 7) : '—';
  const statusColor = STATUS_COLORS[repo.status] || 'bg-text-muted';
  const statusLabel = STATUS_LABELS[repo.status] || repo.status;

  return (
    <header className="border-b border-border-muted bg-surface">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm text-text-muted transition-colors hover:text-text-primary"
            >
              ← Dashboard
            </Link>
            <div className="h-4 w-px bg-border-muted" />
            <div className="flex items-center gap-3">
              <span className="font-medium text-text-primary">{repo.name}</span>
              <span className="rounded-control bg-bg px-1.5 py-0.5 font-mono text-xs text-text-muted">
                {displaySha}
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`inline-block h-2 w-2 rounded-full ${statusColor}`} />
                <span className="text-xs text-text-muted">{statusLabel}</span>
              </span>
            </div>
          </div>
        </div>
        <nav className="-mb-px flex gap-6">
          {TABS.map((tab) => (
            <Link
              key={tab.path}
              href={`/repositories/${repo.id}/${tab.path}`}
              className={`border-b-2 pb-3 text-sm transition-colors ${
                activeTab === tab.path
                  ? 'border-primary text-text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
