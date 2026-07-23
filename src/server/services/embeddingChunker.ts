const EMBEDDING_DIM = 384;
const DEFAULT_WINDOW = 30;

export interface ChunkRange {
  startLine: number;
  endLine: number;
}

export interface SymbolRange {
  kind: string;
  startLine: number;
  endLine: number;
}

export function computeChunkRanges(fileContent: string, symbolRanges: SymbolRange[]): ChunkRange[] {
  const lines = fileContent.split("\n");
  // If fileContent is empty, totalLines is 0
  const totalLines = fileContent.length === 0 ? 0 : lines.length;
  if (totalLines === 0) return [];

  const qualifying = symbolRanges
    .filter((s) => ["function", "class", "interface"].includes(s.kind))
    .sort((a, b) => a.startLine - b.startLine);

  if (qualifying.length === 0) {
    return fixedWindowChunks(1, totalLines, DEFAULT_WINDOW);
  }

  const chunks: ChunkRange[] = [];

  for (const sym of qualifying) {
    chunks.push({ startLine: sym.startLine, endLine: sym.endLine });
  }

  let prevEnd = 0;
  for (const sym of qualifying) {
    if (sym.startLine > prevEnd + 1) {
      const gapStart = prevEnd + 1;
      const gapEnd = sym.startLine - 1;
      if (gapStart <= gapEnd) {
        chunks.push(...fixedWindowChunks(gapStart, gapEnd, DEFAULT_WINDOW));
      }
    }
    prevEnd = Math.max(prevEnd, sym.endLine);
  }

  if (totalLines > prevEnd) {
    chunks.push(...fixedWindowChunks(prevEnd + 1, totalLines, DEFAULT_WINDOW));
  }

  return chunks.sort((a, b) => a.startLine - b.startLine);
}

function fixedWindowChunks(startLine: number, endLine: number, window: number): ChunkRange[] {
  const chunks: ChunkRange[] = [];
  let current = startLine;
  while (current <= endLine) {
    const chunkEnd = Math.min(current + window - 1, endLine);
    chunks.push({ startLine: current, endLine: chunkEnd });
    current = chunkEnd + 1;
  }
  return chunks;
}

export function sliceChunkText(fileContent: string, startLine: number, endLine: number): string {
  const lines = fileContent.split("\n");
  const start = Math.max(startLine - 1, 0);
  const end = Math.min(endLine, lines.length);
  return lines.slice(start, end).join("\n");
}
