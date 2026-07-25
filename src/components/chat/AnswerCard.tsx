import React from 'react';

import { ChatCitation } from '@/lib/chat';
import { parseInlineCitations } from '@/lib/chat';
import Citation from './Citation';

type Props = {
  answer: string;
  citations: ChatCitation[];
  repoId: string;
};

export default function AnswerCard({ answer, citations, repoId }: Props) {
  const labelToCitation = new Map(citations.map(c => [c.label, c]));
  const segments = parseInlineCitations(answer, labelToCitation);

  return (
    <div className="rounded-card border border-border-muted bg-surface p-4">
      <div className="max-w-[680px] text-sm leading-relaxed text-text-primary">
        {segments.map((segment, i) => {
          if (segment.type === 'text') {
            return <span key={i}>{segment.content}</span>;
          }
          return (
            <Citation
              key={i}
              citation={segment.citation}
              label={segment.label}
              repoId={repoId}
            />
          );
        })}
      </div>
    </div>
  );
}
