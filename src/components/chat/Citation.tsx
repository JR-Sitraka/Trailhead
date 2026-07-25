import { ChatCitation } from '@/lib/chat';
import React from 'react';

import Link from 'next/link';

type Props = {
  citation: ChatCitation;
  label: number;
  repoId: string;
};

export default function Citation({ citation, label, repoId }: Props) {
  return (
    <Link
      href={`/repositories/${repoId}/explorer`}
      className="font-mono text-[13px] text-citation hover:underline"
    >
      [{label}] ({citation.path}:{citation.startLine})
    </Link>
  );
}
