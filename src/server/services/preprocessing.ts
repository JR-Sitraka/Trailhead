import AdmZip from "adm-zip";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as zlib from "zlib";

const MAX_ZIP_SIZE = 150 * 1024 * 1024;
const MAX_UNPACKED_SIZE = 500 * 1024 * 1024;
const MAX_FILE_COUNT = 5000;
const MAX_FILE_PARSE_SIZE = 1 * 1024 * 1024;

// Symlink targets are filesystem paths — a few KB is already generous. A
// symlink entry declaring a larger body is malformed or hostile. Security
// findings 4c/4d (2026-08-02): `entry.getData()` performs
// `Buffer.alloc(entry.header.size)` using the archive's own DECLARED size
// before any of our accounting can run, so oversized entries have to be
// rejected from central-directory metadata alone.
const MAX_SYMLINK_TARGET_SIZE = 4096;

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
  ".wasm", ".DS_Store", ".map",
  // AVA snapshot files: an ASCII header ("AVA Snapshot v3\n") in front of a
  // zlib-compressed body, so the 16-byte signature check reads them as text.
  // Belt-and-braces only — the real fix is the full-content NUL scan below.
  ".snap"
]);

const CONFIG_FILENAMES = new Set([
  "package.json", "tsconfig.json", ".env", ".env.example",
  "requirements.txt", "pyproject.toml", "Cargo.toml",
  "go.mod", "Gemfile", "composer.json",
  "next.config.js", "next.config.ts",
  "vite.config.js", "vite.config.ts",
  "webpack.config.js",
  "docker-compose.yml", "Dockerfile",
  ".eslintrc", ".eslintrc.js", ".eslintrc.cjs", ".eslintrc.ts",
  "drizzle.config.ts"
]);

const ENTRYPOINT_FILENAMES = new Set([
  "index.ts", "index.js", "index.mjs", "index.cjs",
  "main.ts", "main.js", "main.mjs", "main.cjs",
  "app.ts", "app.js", "app.mjs", "app.cjs",
  "server.ts", "server.js", "server.mjs", "server.cjs"
]);

// Best-effort heuristic — not exhaustive. Config detection is filename-based;
// entrypoint detection checks package.json main/scripts plus common root filenames.
function detectCategory(filePath: string, fileData: Buffer): "entrypoint" | "config" | null {
  const base = path.basename(filePath);
  if (CONFIG_FILENAMES.has(base)) return "config";

  if (base === "package.json") {
    try {
      const pkg = JSON.parse(fileData.toString("utf8"));
      if (pkg.main || pkg.scripts?.start || pkg.scripts?.dev) return "entrypoint";
    } catch {
      // ignore parse errors
    }
  }

  if (ENTRYPOINT_FILENAMES.has(base)) return "entrypoint";

  return null;
}

export async function fetchGithubZipball(owner: string, repo: string, ref: string): Promise<Buffer> {
  const apiBase = "https://api.github.com";
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "trailhead/1.0"
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const zipUrl = `${apiBase}/repos/${owner}/${repo}/zipball/${ref}`;
  const response = await fetch(zipUrl, { headers, redirect: "follow" });

  if (!response.ok) {
    throw new Error(`GitHub zipball download failed: ${response.status} ${response.statusText}`);
  }

  const MAX_ZIP_SIZE = 150 * 1024 * 1024;
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("GitHub zipball response has no body");
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.length;
    if (totalBytes > MAX_ZIP_SIZE) {
      await reader.cancel();
      throw new Error(`GitHub zipball exceeds 150MB limit (${totalBytes} bytes)`);
    }
    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks);
}

export function stripGitHubTopLevel(zipBuffer: Buffer): Buffer {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  const firstEntry = entries[0];
  if (!firstEntry || !firstEntry.isDirectory) {
    return zipBuffer;
  }

  const topDir = firstEntry.entryName.replace(/\/$/, "");
  if (!topDir) return zipBuffer;

  const prefix = topDir + "/";

  for (const entry of entries) {
    if (entry.entryName.startsWith(prefix)) {
      entry.entryName = entry.entryName.slice(prefix.length);
    }
  }

  return zip.toBuffer();
}

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
  files: Array<{ path: string; size: number; language: string | null; skipped: boolean; skipReason: string | null; content: string | null; category: "entrypoint" | "config" | null }>;
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

// A NUL byte anywhere in the content makes it unstorable: PostgreSQL `text`
// cannot hold U+0000, and the file rows are inserted as one multi-row
// statement, so a single poisoned value fails the whole batch (this is the
// real, confirmed cause of sindresorhus/boxen importing with zero files).
// detectBinaryBySignature only ever sees the first 16 bytes, which is why
// header-then-binary formats slip past it — this scans everything.
function containsNullByte(content: string): boolean {
  return content.includes("\u0000");
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
        // Early header-size guard (security finding 4c). This branch calls
        // getData() to read the link target, and previously did so with NO
        // size bound of any kind — the repository-wide budget below is never
        // reached on this path because of the `continue`. A hostile archive
        // could therefore declare a huge symlink body and force a large
        // allocation. Rejected here from declared metadata, before allocating.
        if (entry.header.size > MAX_SYMLINK_TARGET_SIZE) {
          throw new SecurityError(
            `Unsafe symlink: ${entryName} declares a ${entry.header.size}-byte target (max ${MAX_SYMLINK_TARGET_SIZE} bytes)`
          );
        }
        const rawData = entry.getData();
        const linkTarget = rawData.toString("utf8");
        try {
          resolveAndCheckSymlink(entryName, linkTarget, tmpDir);
        } catch (e) {
          if (e instanceof SecurityError) throw e;
        }
        continue;
      }

      // Read the entry's real bytes ONCE, up front. The repository-wide
      // unpacked-size budget is charged and checked here, before any of the
      // early continuations below — previously the per-file parse-ceiling
      // branch added to `unpackedSize` and then `continue`d straight past the
      // check, so a repository of large text files could blow through 500MB
      // with `truncated` never set (confirmed 2026-08-02: 300 x 2MB = 600MB
      // unpacked, truncated false). Every entry now contributes to the total
      // and is checked against it on the same path.
      //
      // Actual decompressed bytes are used, never the ZIP header's declared
      // size, which a hostile archive controls.
      // Early header-size guard (security finding 4d). `entry.getData()`
      // allocates `Buffer.alloc(entry.header.size)` from the archive's own
      // DECLARED size, so the real accounting below — which charges actual
      // decompressed bytes — only runs AFTER the allocation it is meant to
      // bound. Check the declared size against the remaining budget first.
      //
      // Sound because adm-zip bounds real decompressed output by that same
      // declared value, proven in tests/preprocessing-size-header-guard.test.ts:
      // DEFLATED entries pass it to zlib as `maxOutputLength` (an
      // under-reported entry throws ERR_BUFFER_TOO_LARGE rather than
      // over-allocating), and STORED entries are bounded by the same
      // Buffer.alloc plus a truncating copy. A hostile archive therefore
      // cannot under-report its way past this check.
      //
      // This is an EARLY REJECTION, not a replacement: the actual-byte
      // accounting below is retained unchanged and remains the real
      // enforcement, since a declared size can be smaller than reality.
      const declaredSize = entry.header.size;
      if (unpackedSize + declaredSize > MAX_UNPACKED_SIZE) {
        result.truncated = true;
        if (fileCount === 0) {
          throw new SecurityError("Unpacked size exceeds 500MB limit with zero files indexed");
        }
        break;
      }

      let entryData: Buffer;
      try {
        entryData = entry.getData();
      } catch (e) {
        throw new SecurityError(`Failed to extract entry: ${entryName}: ${(e as Error).message}`);
      }

      unpackedSize += entryData.length;
      if (unpackedSize > MAX_UNPACKED_SIZE) {
        result.truncated = true;
        if (fileCount === 0) {
          throw new SecurityError("Unpacked size exceeds 500MB limit with zero files indexed");
        }
        break;
      }

      // 1MB per-file parse ceiling: still listed in the tree and marked
      // skipped with a reason (safe-preprocessing.md's Business Rules), just
      // never parsed — and never written to disk, since nothing reads it back.
      if (entryData.length > MAX_FILE_PARSE_SIZE && !hasBinaryExtension(entryName) && !detectBinaryBySignature(entryData.slice(0, 16))) {
        const language = detectLanguage(entryName);
        result.files.push({
          path: entryName,
          size: entryData.length,
          language,
          skipped: true,
          skipReason: `exceeds_max_parse_size (${Math.round(entryData.length / 1024)}KB > 1MB)`,
          content: null,
          category: null
        });
        fileCount++;
        continue;
      }

      const filePath = path.join(tmpDir, entryName);
      const fileDir = path.dirname(filePath);
      fs.mkdirSync(fileDir, { recursive: true });

      try {
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

      const isBinary = hasBinaryExtension(entryName);
      let isBinaryByContent = false;
      if (!isBinary) {
        try {
          const fd = fs.openSync(filePath, "r");
          const headerBuf = Buffer.alloc(16);
          const bytesRead = fs.readSync(fd, headerBuf, 0, 16, 0);
          fs.closeSync(fd);
          isBinaryByContent = detectBinaryBySignature(
            bytesRead > 0 ? headerBuf.slice(0, bytesRead) : Buffer.alloc(0)
          );
        } catch {
          // ignore read errors
        }
      }

      let shouldSkip = stripped || isBinary || isBinaryByContent;
      let skipReason = shouldSkip
        ? stripped
          ? "in_strip_directory"
          : "binary_file"
        : null;

      let language = !shouldSkip ? detectLanguage(entryName) : null;

      let content: string | null = null;
      let category: "entrypoint" | "config" | null = null;
      if (!shouldSkip) {
        try {
          content = fs.readFileSync(filePath, "utf8");
          category = detectCategory(entryName, Buffer.from(content));
        } catch {
          // leave content/category null on read error
        }
      }

      // Full-content NUL scan — the durable fix for header-then-binary formats
      // (AVA .snap, and anything else whose first 16 bytes look like text).
      // These are reclassified as binary rather than dropped, so the file is
      // still indexed and visible in Explorer, just without unstorable content.
      if (!shouldSkip && content !== null && containsNullByte(content)) {
        shouldSkip = true;
        skipReason = "binary_file";
        language = null;
        content = null;
        category = null;
      }

      result.files.push({
        path: entryName,
        size: fileSize,
        language,
        skipped: shouldSkip,
        skipReason,
        content,
        category
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
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "trailhead/1.0"
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const repoRes = await fetch(`${apiBase}/repos/${owner}/${repo}`, { headers });
  if (repoRes.status === 404) throw new Error("Repository not found");
  if (!repoRes.ok) throw new Error(`GitHub API error: ${repoRes.status} ${repoRes.statusText}`);
  const repoData = (await repoRes.json()) as { default_branch: string; private: boolean };
  if (repoData.private) throw new Error("Repository is private");

  const branchesRes = await fetch(`${apiBase}/repos/${owner}/${repo}/branches`, { headers });
  const branches: string[] = branchesRes.ok ? (await branchesRes.json() as Array<{ name: string }>).map((b) => b.name) : [repoData.default_branch];

  const headRes = await fetch(`${apiBase}/repos/${owner}/${repo}/commits/${repoData.default_branch}`, { headers });
  if (!headRes.ok) {
    throw new Error(`GitHub HEAD commit fetch failed for ${owner}/${repo}: ${headRes.status} ${headRes.statusText}`);
  }
  const headData = (await headRes.json()) as { sha: string };
  const commitSha = headData.sha;

  return { owner, repo, defaultBranch: repoData.default_branch, branches, commitSha };
}
