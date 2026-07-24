'use client';

import React from 'react';
import type { RepoStatus } from './types';

interface StatusPillProps {
  status: RepoStatus;
}

const LABELS: Record<RepoStatus, string> = {
  queued: 'Queued',
  analyzing: 'Analyzing',
  ready: 'Ready',
  failed: 'Failed',
};

const STATUS_STYLES: Record<RepoStatus, string> = {
  queued: 'text-text-muted bg-text-muted/10 border-text-muted/30',
  analyzing: 'text-primary bg-primary/10 border-primary/35',
  ready: 'text-success bg-success/10 border-success/35',
  failed: 'text-danger bg-danger/10 border-danger/35',
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-control border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      <span className="relative flex h-2 w-2">
        {status === 'analyzing' && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            status === 'analyzing' ? 'bg-primary' : status === 'ready' ? 'bg-success' : status === 'failed' ? 'bg-danger' : 'bg-text-muted'
          }`}
        />
      </span>
      {LABELS[status]}
    </span>
  );
}
