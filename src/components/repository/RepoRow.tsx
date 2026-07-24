'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CodeIcon,
  FileIcon,
  GitCommitHorizontalIcon,
  RefreshCwIcon,
  Trash2Icon,
} from 'lucide-react';
import { StatusPill } from './StatusPill';
import type { Repository } from './types';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

// ROW_GRID: grid-template-columnums must align exactly with the header row
// in Dashboard.tsx. Header columns: name | commitSha | lastAnalyzed |
// status | actions — do not change one without changing the other.
const ROW_GRID = 'grid grid-cols-[1fr_120px_140px_110px_1fr] items-center gap-4';

interface RepoRowProps {
  repo: Repository;
  onReanalyze: () => void;
  onDelete: () => void;
}

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  github: <GithubIcon className="h-4 w-4 text-text-muted" />,
  zip: <FileIcon className="h-4 w-4 text-text-muted" />,
};

export function RepoRow({ repo, onReanalyze, onDelete }: RepoRowProps) {
  return (
    <motion.div
      className={`${ROW_GRID} rounded-card border border-border-muted bg-surface px-4 py-3 transition-colors hover:bg-surface-hover`}
      layout
    >
      {/* Name / path */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="shrink-0">{SOURCE_ICONS[repo.source] ?? <CodeIcon className="h-4 w-4 text-text-muted" />}</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-primary">{repo.name}</p>
          <p className="truncate text-xs text-text-muted">{repo.path}</p>
        </div>
      </div>

      {/* Commit SHA */}
      <div className="flex items-center gap-1.5 overflow-hidden">
        <GitCommitHorizontalIcon className="h-3.5 w-3.5 shrink-0 text-text-muted" />
        <span className="truncate font-mono text-xs text-text-muted">
          {repo.commitSha ? repo.commitSha.slice(0, 7) : '—'}
        </span>
      </div>

      {/* Last analyzed */}
      <span className="truncate text-xs text-text-muted">{repo.lastAnalyzed}</span>

      {/* Status pill */}
      <StatusPill status={repo.status} />

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <a
          href={`/repositories/${repo.id}/overview`}
          className={`rounded-control px-3 py-1.5 text-xs font-medium transition-colors ${
            repo.status === 'ready'
              ? 'border border-border-muted text-text-primary hover:bg-surface-hover'
              : 'cursor-not-allowed border border-border-muted text-text-muted/50'
          }`}
          aria-disabled={repo.status !== 'ready'}
          onClick={(e) => {
            if (repo.status !== 'ready') e.preventDefault();
          }}
        >
          Open
        </a>
        <button
          onClick={onReanalyze}
          className="rounded-control border border-border-muted px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          <RefreshCwIcon className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-control border border-border-muted px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-danger/50 hover:text-danger"
        >
          <Trash2Icon className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
