import { getSingletonHighlighter, bundledLanguagesInfo, type HighlighterGeneric } from 'shiki';

export const SHIKI_THEME = 'tokyo-night';

const LANGUAGE_MAP: Record<string, string | undefined> = {
  typescript: 'typescript',
  javascript: 'javascript',
  python: 'python',
  json: 'json',
  yaml: 'yaml',
  markdown: 'markdown',
  dockerfile: 'docker',
  makefile: 'make',
  protobuf: 'proto',
  shell: 'shellscript',
  vlang: 'v',
};

const KNOWN_SHIKI_IDS = new Set(bundledLanguagesInfo.map(i => i.id));

export function mapToShikiLang(language: string | null): string | null {
  if (!language) return null;
  const direct = LANGUAGE_MAP[language];
  if (direct) return direct;
  if (KNOWN_SHIKI_IDS.has(language)) return language;
  return null;
}

const HIGH_LANGS = [
  'typescript', 'javascript', 'python', 'json', 'yaml', 'markdown',
  'go', 'rust', 'ruby', 'java', 'c', 'cpp', 'html', 'css', 'sql',
  'vue', 'svelte', 'swift', 'dart', 'php', 'kotlin', 'scala', 'r',
  'lua', 'perl', 'haskell', 'elixir', 'clojure', 'zig', 'nim',
  'crystal', 'v', 'docker', 'make', 'proto', 'shellscript',
];

let highlighterPromise: Promise<HighlighterGeneric<string, string>> | null = null;

async function getShikiHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = getSingletonHighlighter({
      themes: [SHIKI_THEME],
      langs: HIGH_LANGS,
    }) as Promise<HighlighterGeneric<string, string>>;
  }
  return highlighterPromise;
}

export interface HighlightedLines {
  lines: string[];
  highlighterError: boolean;
}

export async function highlightCode(code: string, language: string | null): Promise<HighlightedLines | null> {
  const shikiLang = mapToShikiLang(language);
  if (!shikiLang) {
    return null;
  }

  try {
    const hl = await getShikiHighlighter();
    const { tokens } = hl.codeToTokens(code, { lang: shikiLang, theme: SHIKI_THEME });
    const lines = tokens.map(lineTokens => {
      return lineTokens.map((token, index) => {
        const color = token.color || undefined;
        if (color) {
          return `<span style="color:${color}">${escapeHtml(token.content)}</span>`;
        }
        return escapeHtml(token.content);
      }).join('');
    });
    return { lines, highlighterError: false };
  } catch (error) {
    return { lines: code.split('\n').map(line => escapeHtml(line)), highlighterError: true };
  }
}

function escapeHtml(str: string): string {
  if (!str) return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
