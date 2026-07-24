import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
console.log("__dirname:", __dirname);
console.log("join:", join(__dirname, "..", ".env"));

const content = readFileSync(join(__dirname, "..", ".env"), "utf-8");
console.log("content length:", content.length);
console.log("first chars:", JSON.stringify(content.slice(0, 50)));

for (const line of content.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  console.log("key:", key, "val starts with:", value.slice(0, 10));
}
