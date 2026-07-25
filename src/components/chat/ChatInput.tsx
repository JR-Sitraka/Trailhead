import React from 'react';

import { ArrowUpIcon } from 'lucide-react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
};

export default function ChatInput({ value, onChange, onSubmit, disabled }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Ask a follow-up…"
        aria-label="Ask a follow-up question"
        className="flex-1 rounded-control border border-border-muted bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className="inline-flex items-center justify-center rounded-control bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Ask"
      >
        <ArrowUpIcon className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}
