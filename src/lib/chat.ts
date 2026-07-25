export interface ChatCitation {
  fileId: string;
  path: string;
  startLine: number;
  endLine: number;
  label: number;
}

export interface InlineCitationSegment {
  type: "text";
  content: string;
}

export interface InlineCitationMarker {
  type: "citation";
  label: number;
  citation: ChatCitation;
}

export type InlineCitationSegmentOrMarker = InlineCitationSegment | InlineCitationMarker;

export function parseInlineCitations(
  answer: string,
  labelToCitation: Map<number, ChatCitation>
): InlineCitationSegmentOrMarker[] {
  const segments: InlineCitationSegmentOrMarker[] = [];
  const regex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(answer)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: answer.slice(lastIndex, match.index) });
    }
    const label = parseInt(match[1], 10);
    const citation = labelToCitation.get(label);
    if (citation) {
      segments.push({ type: "citation", label, citation });
    } else {
      segments.push({ type: "text", content: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < answer.length) {
    segments.push({ type: "text", content: answer.slice(lastIndex) });
  }

  return segments;
}
