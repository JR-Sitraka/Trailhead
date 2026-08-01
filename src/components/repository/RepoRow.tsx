'use client';

import React from 'react';
import { RefreshCwIcon, Trash2Icon, FileIcon, GitCommitHorizontalIcon } from 'lucide-react';
import { StatusPill, STATUS_LABELS } from './StatusPill';
import type { Repository } from './types';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

// ROW_GRID: column widths MUST stay identical (string-for-string) to the
// header row's grid template in Dashboard.tsx. CSS Grid auto-sizes each
// grid container independently — two separate grids using the same
// template syntax will NOT align with each other unless the explicit
// widths match exactly.
const ROW_GRID = 'grid grid-cols-[minmax(0,1.6fr)_110px_110px_140px_230px] items-center gap-4';

interface RepoRowProps {
  repo: Repository;
  onReanalyze: () => void;
  onDelete: () => void;
}

export function RepoRow({ repo, onReanalyze, onDelete }: RepoRowProps) {
  const shortSha = repo.commitSha ? repo.commitSha.slice(0, 7) : null;
  const SourceIcon = repo.source === 'github' ? GithubIcon : FileIcon;

  return (
    <div className={`${ROW_GRID} px-4 py-3 transition-colors hover:bg-surface-hover`}>
      {/* Repository column */}
      <div className="flex min-w-0 items-center gap-2.5">
        <SourceIcon className="h-4 w-4 shrink-0 text-text-muted" />
        <span className="truncate text-sm font-medium text-text-primary">{repo.path}</span>
      </div>

      {/* Status column */}
      <div className="justify-self-start">
        <StatusPill status={repo.status} />
      </div>

      {/* Last commit column */}
      <div className="justify-self-start">
        {shortSha ? (
          <span className="inline-flex items-center gap-1 font-mono text-[13px] text-text-muted">
            <GitCommitHorizontalIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            {shortSha}
          </span>
        ) : (
          <span className="font-mono text-[13px] text-text-muted/60">—</span>
        )}
      </div>

      {/* Updated column */}
      <div className="justify-self-start text-xs text-text-muted">{repo.lastAnalyzed}</div>

      {/* Actions column */}
      <div className="flex items-center gap-2 justify-self-end">
        <a
          href={`/repositories/${repo.id}/overview`}
          aria-disabled={repo.status !== 'ready'}
          aria-label={`Open ${repo.name}, status: ${STATUS_LABELS[repo.status]}`}
          onClick={(e) => {
            if (repo.status !== 'ready') e.preventDefault();
          }}
          className={`rounded-control px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
            repo.status === 'ready'
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'cursor-not-allowed bg-primary/25 text-white/60'
          }`}
        >
          Open
        </a>
        <button
          type="button"
          onClick={onReanalyze}
          className="inline-flex items-center gap-1.5 rounded-control border border-border-muted bg-transparent px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:border-text-muted/60 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <RefreshCwIcon className="h-3.5 w-3.5" strokeWidth={2} />
          Reanalyze
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${repo.name}`}
          title="Delete"
          className="rounded-control p-1.5 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
        >
          <Trash2Icon className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
