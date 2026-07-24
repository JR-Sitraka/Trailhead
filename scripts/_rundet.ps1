import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { promisify } from "node:util";
import { setTimeout as pTimeout } from "node:timers/promises";

const testFile = "tests/chat.test.ts";
const testFilter = "returns status=answered with resolved citations";
const jsonReporter = "json";

const lines: number[] = [];

for (let i = 1; i <= 10; i++) {
  const child = spawn(
    process.execPath,
    [
      ...(process.execArgv.filter((a) => !a.includes("inspect"))),
      ...(process.execPath.includes("node") ? [] : []),
    ],
    {
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
    }
  );

  // Use npx properly via spawn
  const npx = spawn(
    "npx.cmd",
    ["vitest", "run", testFile, "-t", testFilter, "--reporter", jsonReporter],
    {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    }
  );

  let stdout = "";
  let stderr = "";
  npx.stdout.on("data", (d) => { stdout += d.toString(); });
  npx.stderr.on("data", (d) => { stderr += d.toString(); });

  const exitCode = await new Promise<number>((resolve) => {
    npx.on("close", (code) => resolve(code ?? 0));
  });

  if (exitCode !== 0) {
    console.log(`Run ${i}: vitest exited with code ${exitCode}`);
    console.log(stderr.slice(0, 300));
    lines.push(-1);
    continue;
  }

  // Find the JSON blob in the output (last complete JSON line)
  const jsonBlob = stdout.split("\n").filter((l) => l.trim().startsWith("{"));
  if (jsonBlob.length === 0) {
    console.log(`Run ${i}: no JSON output found. stderr: ${stderr.slice(0, 200)}`);
    lines.push(-1);
    continue;
  }

  let startLine: number | null = null;
  for (const line of jsonBlob) {
    try {
      const parsed = JSON.parse(line);
      const suites: any[] = parsed.testResults ?? [];
      for (const suite of suites) {
        for (const result of suite.assertionResults ?? []) {
          // Look for the specific test result
          const m = result.ancestorTitles?.find((t: string) =>
            t.includes("answered with valid citations")
          );
          if (m && result.status === "passed" && !startLine) {
            // Can't get actual value from failureMessages for passing tests
            break;
          }
        }
      }
    } catch {
      // skip malformed lines
    }
  }

  // Use regex over the whole raw stdout to find the actual assertion printout
  const allOutput = stdout + stderr;
  const match = allOutput.match(/startLine\s*[:=]\s*(\d+)/);
  if (!match) {
    // try to find via console output
    const match2 = allOutput.match(/"startLine"\s*:\s*(\d+)/);
    startLine = match2 ? parseInt(match2[1], 10) : null;
  } else {
    startLine = parseInt(match[1], 10);
  }

  console.log(`Run ${i}: startLine = ${startLine}`);
  lines.push(startLine ?? -1);

  // small delay between runs
  await pTimeout(200);
}

const unique = [...new Set(lines.filter((v) => v >= 0))];
console.log("\n=== SUMMARY ===");
console.log(`All run values : ${lines.join(", ")}`);
console.log(`Derived values : ${unique.join(", ")}`);
console.log(`Unique set size: ${unique.length}`);
console.log(`All same?      : ${unique.length <= 1}`);
