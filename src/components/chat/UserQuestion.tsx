import React from 'react';

type Props = {
  question: string;
};

export default function UserQuestion({ question }: Props) {
  return (
    <div className="mb-3">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">You asked—</p>
      <p className="mt-1 text-text-primary">{question}</p>
    </div>
  );
}
