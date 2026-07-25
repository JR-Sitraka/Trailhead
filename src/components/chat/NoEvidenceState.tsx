import React from 'react';

import { InfoIcon } from 'lucide-react';

type Props = {
  heading: string;
  subtext: string;
};

export default function NoEvidenceState({ heading, subtext }: Props) {
  return (
    <div className="rounded-card border border-dashed border-border-muted bg-surface p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border-muted">
          <InfoIcon className="h-5 w-5 text-text-muted" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-text-primary">{heading}</p>
        <p className="text-sm text-text-muted">{subtext}</p>
      </div>
    </div>
  );
}
