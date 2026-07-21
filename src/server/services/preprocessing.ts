import AdmZip from "adm-zip";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as zlib from "zlib";

const MAX_ZIP_SIZE = 150 * 1024 * 1024;
const MAX_UNPACKED_SIZE = 500 * 1024 * 1024;
const MAX_FILE_COUNT = 5000;
const MAX_FILE_PARSE_SIZE = 1 * 1024 * 1024;

export const STRIP_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "output",
  "out",
  "__pycache__",
  ".next",
  ".cache",
  "vendor",
  ".venv",
  "venv",
  "target",
  ".gradle",
  ".idea",
  ".vscode"
]);

const BINARY_EXTENSIONS = new Set([
  ".exe", ".dll", ".so", ".dylib", ".bin", ".o", ".a", ".lib",
  ".pyc", ".pyo", ".class", ".jar", ".war", ".ear",
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".webp", ".svg",
  ".mp3", ".mp4", ".wav", ".avi", ".mov", ".mkv", ".flac", ".ogg",
  ".zip", ".tar", ".gz", ".bz2", ".xz", ".7z", ".rar",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".sqlite", ".db", ".mdb",
  ".wasm", ".DS_Store", ".map"
]);

const BINARY_SIGNATURES: number[][] = [
  [0x50, 0x4b, 0x03, 0x04],
  [0x50, 0x4b, 0x05, 0x06],
  [0x50, 0x4b, 0x07, 0x08],
  [0x1f, 0x8b],
  [0x75, 0x73, 0x74, 0x61, 0x72],
  [0x42, 0x5a, 0x68],
  [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00],
  [0x89, 0x50, 0x4e, 0x47],
  [0xff, 0xd8, 0xff],
  [0x47, 0x49, 0x46, 0x38],
  [0x42, 0x4d],
  [0x52, 0x49, 0x46, 0x46],
  [0x49, 0x44, 0x33],
  [0x1a, 0x45, 0xdf, 0xa3],
  [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70],
  [0x25, 0x50, 0x44, 0x46],
  [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
  [0x7f, 0x45, 0x4c, 0x46],
  [0xfe, 0xed, 0xfa, 0xce],
  [0xcf, 0xfa, 0xed, 0xfe],
];

export interface PreprocessingResult {
  files: Array<{ path: string; size: number; language: string | null; skipped: boolean; skipReason: string | null }>;
  totalFiles: number;
  truncated: boolean;
  totalUnpackedSize: number;
}

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SecurityError";
  }
}

function isInStripDir(filePath: string): boolean {
  const parts = filePath.split("/");
  for (const part of parts) {
    if (STRIP_DIRS.has(part)) return true;
  }
  return false;
}

function hasBinaryExtension(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

function detectBinaryBySignature(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  for (const sig of BINARY_SIGNATURES) {
    if (buffer.length >= sig.length) {
      let match = true;
      for (let i = 0; i < sig.length; i++) {
        if (buffer[i] !== sig[i]) { match = false; break; }
      }
      if (match) return true;
    }
  }
  const nullByteCount = buffer.filter((b) => b === 0).length;
  return nullByteCount > buffer.length * 0.3;
}

function detectLanguage(filePath: string): string | null {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript", mts: "typescript", cts: "typescript",
    js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
    py: "python", pyw: "python",
    rb: "ruby", rbw: "ruby",
    go: "go",
    rs: "rust",
    java: "java", kt: "kotlin", kts: "kotlin",
    c: "c", h: "c",
    cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp", hh: "cpp",
    cs: "csharp",
    php: "php",
    swift: "swift",
    dart: "dart",
    vue: "vue",
    svelte: "svelte",
    html: "html", htm: "html",
    css: "css", scss: "scss", sass: "scss", less: "less",
    json: "json",
    yaml: "yaml", yml: "yaml",
    toml: "toml",
    xml: "xml", xmlrss: "xml",
    sql: "sql",
    sh: "shell", bash: "shell", zsh: "shell", fish: "shell",
    ps1: "powershell", psm1: "powershell",
    md: "markdown", markdown: "markdown",
    dockerfile: "dockerfile",
    makefile: "makefile",
    proto: "protobuf",
    graphql: "graphql", gql: "graphql",
    r: "r",
    lua: "lua",
    pl: "perl", pm: "perl",
    hs: "haskell",
    ex: "elixir", exs: "elixir",
    clj: "clojure",
    lisp: "lisp",
    scm: "scheme",
    v: "vlang",
    zig: "zig",
    nim: "nim",
    cr: "crystal"
  };
  const base = path.basename(filePath).toLowerCase();
  if (map[base]) return map[base];
  return map[ext] || null;
}

export function resolveAndCheckSymlink(linkPath: string, linkTarget: string, archiveRoot: string): void {
  const linkFullPath = path.join(archiveRoot, linkPath);
  const linkDir = path.dirname(linkFullPath);
  let resolved: string;
  try {
    resolved = path.resolve(linkDir, linkTarget);
  } catch {
    throw new SecurityError(`Unsafe symlink: ${linkPath} -> ${linkTarget}`);
  }
  const normalizedRoot = path.resolve(archiveRoot);
  const normalizedResolved = path.resolve(resolved);
  if (!normalizedResolved.startsWith(normalizedRoot + path.sep) && normalizedResolved !== normalizedRoot) {
    throw new SecurityError(`Unsafe symlink: ${linkPath} -> ${linkTarget} (resolves outside archive root)`);
  }
}

export function validatePathTraversal(entryName: string): void {
  const normalizedPath = entryName.replace(/\\/g, "/");
  const cleanPath = normalizedPath.replace(/\/+/g, "/").replace(/^\//, "");
  if (!cleanPath) return;
  const parts = cleanPath.split("/");
  for (const part of parts) {
    if (part === "..") {
      throw new SecurityError(`Path traversal detected in entry: ${entryName}`);
    }
  }
}

export async function validateZipSafety(zipBuffer: Buffer, sourceId: string): Promise<PreprocessingResult> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `trailhead-${sourceId}-`));

  try {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    for (const entry of entries) {
      try {
        validatePathTraversal(entry.entryName);
      } catch (e) {
        if (e instanceof SecurityError) throw e;
      }
    }

    const result: PreprocessingResult = {
      files: [],
      totalFiles: 0,
      truncated: false,
      totalUnpackedSize: 0
    };

    let fileCount = 0;
    let unpackedSize = 0;

    for (const entry of entries) {
      if (result.truncated) break;

      const entryName = entry.entryName.replace(/\\/g, "/").replace(/^\//, "").replace(/\/+$/, "");
      if (!entryName) continue;

      const parts = entryName.split("/");
      const stripped = parts.some((p) => STRIP_DIRS.has(p));
      if (stripped) continue;

      if (entry.isDirectory) {
        const dirPath = path.join(tmpDir, entryName);
        fs.mkdirSync(dirPath, { recursive: true });
        continue;
      }

      if (fileCount >= MAX_FILE_COUNT) {
        result.truncated = true;
        continue;
      }

      const attr = entry.header.attr;
      if (attr && ((attr >>> 16) & 0xF000) === 0xA000) {
        const rawData = entry.getData();
        const linkTarget = rawData.toString("utf8");
        try {
          resolveAndCheckSymlink(entryName, linkTarget, tmpDir);
        } catch (e) {
          if (e instanceof SecurityError) throw e;
        }
        continue;
      }

      try {
        const entryData = entry.getData();
        if (entryData.length > MAX_FILE_PARSE_SIZE && !hasBinaryExtension(entryName) && !detectBinaryBySignature(entryData.slice(0, 16))) {
          const language = detectLanguage(entryName);
          result.files.push({
            path: entryName,
            size: entryData.length,
            language,
            skipped: true,
            skipReason: `exceeds_max_parse_size (${Math.round(entryData.length / 1024)}KB > 1MB)`
          });
          fileCount++;
          unpackedSize += entryData.length;
          continue;
        }
      } catch {
        // skip parse check for this entry
      }

      const filePath = path.join(tmpDir, entryName);
      const fileDir = path.dirname(filePath);
      fs.mkdirSync(fileDir, { recursive: true });

      try {
        const entryData = entry.getData();
        fs.writeFileSync(filePath, entryData);
      } catch (e) {
        throw new SecurityError(`Failed to extract entry: ${entryName}: ${(e as Error).message}`);
      }

      let fileSize = 0;
      try {
        fileSize = fs.statSync(filePath).size;
      } catch {
        continue;
      }

      unpackedSize += fileSize;
      if (unpackedSize > MAX_UNPACKED_SIZE) {
        result.truncated = true;
        if (fileCount === 0) {
          throw new SecurityError("Unpacked size exceeds 500MB limit with zero files indexed");
        }
        break;
      }

      const isBinary = hasBinaryExtension(entryName);
      let isBinaryByContent = false;
      if (!isBinary) {
        try {
          const fd = fs.openSync(filePath, "r");
          const headerBuf = Buffer.alloc(16);
          fs.readSync(fd, headerBuf, 0, 16, 0);
          fs.closeSync(fd);
          isBinaryByContent = detectBinaryBySignature(headerBuf);
        } catch {
          // ignore read errors
        }
      }

      const shouldSkip = stripped || isBinary || isBinaryByContent;
      const skipReason = shouldSkip
        ? stripped
          ? "in_strip_directory"
          : "binary_file"
        : null;

      const language = !shouldSkip ? detectLanguage(entryName) : null;

      result.files.push({
        path: entryName,
        size: fileSize,
        language,
        skipped: shouldSkip,
        skipReason
      });

      fileCount++;
    }

    if (fileCount === 0 && !result.truncated) {
      throw new SecurityError("Zero supported files found after filtering");
    }

    result.totalFiles = fileCount;
    result.totalUnpackedSize = unpackedSize;
    return result;
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // best effort cleanup
    }
  }
}

export async function fetchGithubRepoInfo(url: string): Promise<{ owner: string; repo: string; defaultBranch: string; branches: string[]; commitSha: string | null }> {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/)?$/);
  if (!match) throw new Error("Invalid GitHub URL format");
  const [, owner, repoRaw] = match;
  const repo = repoRaw.replace(/\.git$/, "");

  const apiBase = "https://api.github.com";
  const repoRes = await fetch(`${apiBase}/repos/${owner}/${repo}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "trailhead/1.0" }
  });
  if (repoRes.status === 404) throw new Error("Repository not found or is private");
  if (!repoRes.ok) throw new Error(`GitHub API error: ${repoRes.status} ${repoRes.statusText}`);
  const repoData = (await repoRes.json()) as { default_branch: string; private: boolean };
  if (repoData.private) throw new Error("Repository is private");

  const branchesRes = await fetch(`${apiBase}/repos/${owner}/${repo}/branches`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "trailhead/1.0" }
  });
  const branches: string[] = branchesRes.ok ? (await branchesRes.json() as Array<{ name: string }>).map((b) => b.name) : [repoData.default_branch];

  const headRes = await fetch(`${apiBase}/repos/${owner}/${repo}/commits/${repoData.default_branch}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "trailhead/1.0" }
  });
  const commitSha = headRes.ok ? (await headRes.json() as { sha: string }).sha : null;

  return { owner, repo, defaultBranch: repoData.default_branch, branches, commitSha };
}
