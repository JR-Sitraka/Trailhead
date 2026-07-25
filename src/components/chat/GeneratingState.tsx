import React from 'react';

export default function GeneratingState() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"
          style={{ animationDuration: '1400ms' }}
        />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
      </span>
      <span className="text-sm text-text-muted">Thinking…</span>
    </div>
  );
}
