import React from 'react';

import { AlertTriangleIcon } from 'lucide-react';

type Props = {
  heading?: string;
  subtext?: string;
};

export default function GenerationFailedState({
  heading = "Couldn't generate an answer",
  subtext = "The answer service is temporarily unavailable — try again in a moment.",
}: Props) {
  return (
    <div className="rounded-card border border-danger/30 bg-surface p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-danger/30 text-danger">
          <AlertTriangleIcon className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-text-primary">{heading}</p>
        <p className="text-sm text-text-muted">{subtext}</p>
      </div>
    </div>
  );
}
