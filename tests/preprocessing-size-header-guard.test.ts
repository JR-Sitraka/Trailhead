import { describe, it, expect } from 'vitest';
import AdmZip from 'adm-zip';
import { validateZipSafety, SecurityError } from '../src/server/services/preprocessing';

// Security remediation of findings 4c/4d (2026-08-02). Step 1 + Step 2 of the
// gated remediation: these tests establish the INVARIANT the whole fix depends
// on, and they are deliberately written BEFORE any production change.
//
// The proposed guard is: read the ZIP central directory's DECLARED uncompressed
// size (`entry.header.size`) and reject oversized entries BEFORE calling
// `entry.getData()`, which is what performs the real allocation.
//
// That guard is only sound if a hostile archive cannot UNDER-REPORT its
// declared size and then decompress to something much larger. If under-reporting
// worked, a header check would be security theatre — the attacker would simply
// declare 1KB and ship 4GB.
//
// ALL payloads here are deliberately small (≤300KB, ~316 compressed bytes) and
// all caps are 4KB. No test in this file ever performs a large allocation —
// KNOWN-GOOD records this machine at ~2.2GB free, and bounded testing is
// mandatory, not optional.

const TEST_CAP_BYTES = 4096;
const PAYLOAD_BYTES = 300 * 1024; // 300KB, compresses to ~316 bytes

const LOCAL_HEADER_SIG = 0x04034b50; // uncompressed size at +22
const CENTRAL_HEADER_SIG = 0x02014b50; // uncompressed size at +24

/** Build a ZIP whose declared uncompressed size is patched to a lie. */
function zipWithPatchedDeclaredSize(
  name: string,
  payload: Buffer,
  declaredSize: number,
  attr?: number
): Buffer {
  const zip = new AdmZip();
  zip.addFile(name, payload);
  if (attr !== undefined) zip.getEntries()[0].attr = attr;
  const buf = zip.toBuffer();

  // Patch BOTH the local file header and the central directory header, so the
  // archive is internally consistent and adm-zip doesn't reject it for an
  // unrelated structural reason.
  for (let i = 0; i + 4 <= buf.length; i++) {
    const sig = buf.readUInt32LE(i);
    if (sig === LOCAL_HEADER_SIG) buf.writeUInt32LE(declaredSize, i + 22);
    if (sig === CENTRAL_HEADER_SIG) buf.writeUInt32LE(declaredSize, i + 24);
  }
  return buf;
}

describe('adm-zip invariant: declared header size bounds real decompressed output', () => {
  it('BASELINE: an honestly-declared entry reports its real size in the header and decompresses to exactly that', () => {
    const zip = new AdmZip();
    zip.addFile('honest.txt', Buffer.alloc(PAYLOAD_BYTES, 0x41));
    const entry = new AdmZip(zip.toBuffer()).getEntries()[0];

    // The declared size is readable from the central directory WITHOUT
    // decompressing — this is what makes an early guard possible at all.
    expect(entry.header.size).toBe(PAYLOAD_BYTES);
    expect(entry.header.method).toBe(8); // DEFLATED
    // Compression ratio is real and large: ~300KB from ~316 bytes.
    expect(entry.header.compressedSize).toBeLessThan(2048);

    expect(entry.getData().length).toBe(PAYLOAD_BYTES);
  });

  it('THE INVARIANT: an UNDER-REPORTED entry cannot decompress past its declared size — zlib throws instead', () => {
    // Declares 4KB, really inflates to 300KB. This is the exact attack that
    // would defeat a header-size guard if it succeeded.
    const buf = zipWithPatchedDeclaredSize('under.txt', Buffer.alloc(PAYLOAD_BYTES, 0x41), TEST_CAP_BYTES);
    const entry = new AdmZip(buf).getEntries()[0];

    // The guard would read this value and allow the entry through (4096 ≤ cap).
    expect(entry.header.size).toBe(TEST_CAP_BYTES);

    // ...but the real decompression is HARD-BOUNDED at the declared size by
    // zlib's maxOutputLength, which adm-zip passes through from the header:
    //   inflater.js:  { maxOutputLength: expectedLength }
    //   zipEntry.js:  new Methods.Inflater(compressedData, _centralHeader.size)
    // So the lie cannot buy the attacker a larger allocation — it throws.
    let threw: any = null;
    try {
      entry.getData();
    } catch (e) {
      threw = e;
    }
    expect(threw).not.toBeNull();
    expect(String(threw.code ?? threw.name)).toContain('ERR_BUFFER_TOO_LARGE');
    expect(String(threw.message)).toContain('4096');
  });

  it('the invariant also holds for a STORED (uncompressed) entry — zlib is not involved, but Buffer.alloc(declared) still bounds it', () => {
    // adm-zip's own writer always DEFLATEs, but a hostile archive can ship
    // method 0. That path has no zlib and therefore no maxOutputLength — it
    // relies instead on `Buffer.alloc(_centralHeader.size)` plus copy
    // truncation, so the allocation is bounded by the declared size either way.
    const zip = new AdmZip();
    zip.addFile('stored.txt', Buffer.alloc(PAYLOAD_BYTES, 0x41));
    const buf = zip.toBuffer();
    for (let i = 0; i + 4 <= buf.length; i++) {
      const sig = buf.readUInt32LE(i);
      if (sig === LOCAL_HEADER_SIG) {
        buf.writeUInt16LE(0, i + 8); // method = STORED
        buf.writeUInt32LE(TEST_CAP_BYTES, i + 22);
      }
      if (sig === CENTRAL_HEADER_SIG) {
        buf.writeUInt16LE(0, i + 10); // method = STORED
        buf.writeUInt32LE(TEST_CAP_BYTES, i + 24);
      }
    }
    const entry = new AdmZip(buf).getEntries()[0];
    expect(entry.header.method).toBe(0);
    expect(entry.header.size).toBe(TEST_CAP_BYTES);

    // Bounded: the copy is truncated at the declared length, so the CRC check
    // fails and the entry is rejected rather than yielding oversized data.
    expect(() => entry.getData()).toThrow(/CRC32/i);
  });

  it('the invariant holds for a SYMLINK-attributed entry too (finding 4c\'s specific path)', () => {
    const symlinkAttr = (0xa000 | 0o644) * 0x10000; // S_IFLNK
    const buf = zipWithPatchedDeclaredSize(
      'evil-link',
      Buffer.alloc(PAYLOAD_BYTES, 0x41),
      TEST_CAP_BYTES,
      symlinkAttr
    );
    const entry = new AdmZip(buf).getEntries()[0];

    expect(entry.header.size).toBe(TEST_CAP_BYTES);
    expect(() => entry.getData()).toThrow();
  });

  it('an honestly-declared OVERSIZED entry exposes its real size in the header, so a guard can reject it without ever calling getData()', () => {
    // 300KB declared honestly, against a 4KB test cap. The guard's whole
    // premise: this is knowable before any allocation happens.
    const zip = new AdmZip();
    zip.addFile('big.txt', Buffer.alloc(PAYLOAD_BYTES, 0x41));
    const entry = new AdmZip(zip.toBuffer()).getEntries()[0];

    expect(entry.header.size).toBe(PAYLOAD_BYTES);
    expect(entry.header.size).toBeGreaterThan(TEST_CAP_BYTES);
    // A guard comparing header.size against the cap rejects here, and
    // getData() — the allocating call — is never reached.
  });

  it('the same holds for an honestly-declared oversized SYMLINK entry', () => {
    const symlinkAttr = (0xa000 | 0o644) * 0x10000;
    const zip = new AdmZip();
    zip.addFile('big-link', Buffer.alloc(PAYLOAD_BYTES, 0x41));
    zip.getEntries()[0].attr = symlinkAttr;
    const entry = new AdmZip(zip.toBuffer()).getEntries()[0];

    expect(entry.header.size).toBe(PAYLOAD_BYTES);
    expect(entry.header.size).toBeGreaterThan(TEST_CAP_BYTES);
    // Real symlink targets are short paths; a few-KB cap is generous.
  });
});

describe('the implemented guards: real validateZipSafety behavior', () => {
  it('4c: an oversized SYMLINK entry is rejected outright, before its body is ever allocated', async () => {
    // 300KB declared symlink target, far past the 4KB cap. Real symlink
    // targets are short paths, so nothing legitimate is affected.
    const symlinkAttr = (0xa000 | 0o644) * 0x10000;
    const zip = new AdmZip();
    zip.addFile('evil-link', Buffer.alloc(PAYLOAD_BYTES, 0x41));
    zip.getEntries()[0].attr = symlinkAttr;
    zip.addFile('normal.js', Buffer.from('export const x = 1;'));

    await expect(
      validateZipSafety(zip.toBuffer(), `guard-symlink-${Date.now()}`)
    ).rejects.toThrow(SecurityError);

    // And the message names the real reason, not a generic failure.
    await expect(
      validateZipSafety(zip.toBuffer(), `guard-symlink-msg-${Date.now()}`)
    ).rejects.toThrow(/declares a 307200-byte target/);
  }, 20000);

  it('4c: a NORMAL small symlink still works — the guard does not break legitimate archives', async () => {
    const symlinkAttr = (0xa000 | 0o644) * 0x10000;
    const zip = new AdmZip();
    zip.addFile('link', Buffer.from('target.txt'));
    zip.getEntries()[0].attr = symlinkAttr;
    zip.addFile('target.txt', Buffer.from('real content here'));

    const result = await validateZipSafety(zip.toBuffer(), `guard-symlink-ok-${Date.now()}`);
    // Symlink entries are never indexed; the target file is.
    expect(result.files.some((f) => f.path === 'link')).toBe(false);
    expect(result.files.some((f) => f.path === 'target.txt')).toBe(true);
  }, 20000);

  it('4d: a single entry declaring more than the whole 500MB budget is rejected without allocating it', async () => {
    // Declares 600MB via a patched header; the real payload is 300KB, so this
    // test never allocates anything large. Pre-fix, getData() would have been
    // called and attempted Buffer.alloc(600MB) before any check ran.
    const buf = zipWithPatchedDeclaredSize(
      'huge.txt',
      Buffer.alloc(PAYLOAD_BYTES, 0x41),
      600 * 1024 * 1024
    );
    const entry = new AdmZip(buf).getEntries()[0];
    expect(entry.header.size).toBe(600 * 1024 * 1024); // the lie is in place

    // fileCount === 0 at this point, so the zero-files rule applies: reject.
    await expect(
      validateZipSafety(buf, `guard-huge-${Date.now()}`)
    ).rejects.toThrow(/Unpacked size exceeds 500MB limit with zero files indexed/);
  }, 20000);

  it('4d: an over-declaring entry AFTER real files truncates rather than rejecting, matching the existing budget rule', async () => {
    // NOTE: adm-zip writes entries in ALPHABETICAL order, not insertion order
    // (confirmed empirically 2026-08-02). The real file therefore has to sort
    // before the oversized one for it to be indexed first — otherwise
    // fileCount is 0 at the oversized entry and the zero-files rule rejects
    // the whole archive instead, which is the previous test's case.
    const zip = new AdmZip();
    zip.addFile('aaa-real.js', Buffer.from('export const a = 1;'));
    zip.addFile('huge.txt', Buffer.alloc(PAYLOAD_BYTES, 0x41));
    const buf = zip.toBuffer();

    // Patch ONLY the second entry's declared size to 600MB.
    for (let i = 0; i + 4 <= buf.length; i++) {
      const sig = buf.readUInt32LE(i);
      if (sig === LOCAL_HEADER_SIG || sig === CENTRAL_HEADER_SIG) {
        const nameLenOff = sig === LOCAL_HEADER_SIG ? 26 : 28;
        const nameOff = sig === LOCAL_HEADER_SIG ? 30 : 46;
        const nameLen = buf.readUInt16LE(i + nameLenOff);
        const name = buf.subarray(i + nameOff, i + nameOff + nameLen).toString();
        if (name === 'huge.txt') {
          buf.writeUInt32LE(600 * 1024 * 1024, i + (sig === LOCAL_HEADER_SIG ? 22 : 24));
        }
      }
    }

    const result = await validateZipSafety(buf, `guard-trunc-${Date.now()}`);
    // The real file was indexed; the over-declaring one triggered truncation
    // instead of an outright reject, exactly as the pre-existing budget rule
    // does for an honestly-oversized file.
    expect(result.truncated).toBe(true);
    expect(result.files.some((f) => f.path === 'aaa-real.js')).toBe(true);
    expect(result.files.some((f) => f.path === 'huge.txt')).toBe(false);
  }, 20000);

  it('regression: an ordinary archive is completely unaffected by both guards', async () => {
    const zip = new AdmZip();
    zip.addFile('src/index.ts', Buffer.from('export const x = 1;\n'));
    zip.addFile('README.md', Buffer.from('# hello\n'));
    const result = await validateZipSafety(zip.toBuffer(), `guard-normal-${Date.now()}`);
    expect(result.truncated).toBe(false);
    expect(result.totalFiles).toBe(2);
    expect(result.files.every((f) => !f.skipped)).toBe(true);
  }, 20000);
});
