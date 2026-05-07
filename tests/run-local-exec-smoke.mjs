import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const repoRoot = process.cwd();
const pluginSource = path.join(repoRoot, "plugins", "codex-spark");
const testRoot = process.env.CODEX_SPARK_TEST_ROOT || "/tmp/codex-spark-plugin-test";
const pluginTarget = path.join(testRoot, "plugins", "codex-spark");
const directSkillTarget = path.join(testRoot, ".agents", "skills", "codex-spark-delegate");
const outputPath = path.join(testRoot, "codex-exec-output.txt");

async function copyIfExists(source, target) {
  await cp(source, target, { recursive: true, force: true });
}

async function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? testRoot,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

await rm(testRoot, { recursive: true, force: true });
await mkdir(path.join(testRoot, "plugins"), { recursive: true });
await mkdir(path.join(testRoot, ".agents", "plugins"), { recursive: true });
await mkdir(path.join(testRoot, ".agents", "skills"), { recursive: true });

await copyIfExists(path.join(pluginSource, ".codex-plugin"), path.join(pluginTarget, ".codex-plugin"));
await copyIfExists(path.join(pluginSource, "skills"), path.join(pluginTarget, "skills"));
await copyIfExists(path.join(pluginSource, "assets"), path.join(pluginTarget, "assets"));

// Codex plugin installation is UI-driven after marketplace discovery. Mirror the
// exact plugin skill into .agents/skills so non-interactive exec can validate the
// same SKILL.md behavior without mutating the user's plugin cache.
await copyIfExists(path.join(pluginSource, "skills", "codex-spark-delegate"), directSkillTarget);

await writeFile(
  path.join(testRoot, ".agents", "plugins", "marketplace.json"),
  JSON.stringify(
    {
      name: "codex-spark-local-test",
      interface: {
        displayName: "Codex Spark Local Test",
      },
      plugins: [
        {
          name: "codex-spark",
          source: {
            source: "local",
            path: "./plugins/codex-spark",
          },
          policy: {
            installation: "AVAILABLE",
            authentication: "ON_INSTALL",
          },
          category: "Productivity",
        },
      ],
    },
    null,
    2,
  ) + "\n",
);

await copyIfExists(path.join(repoRoot, "tests", "fixtures", "index.html"), path.join(testRoot, "index.html"));
await copyIfExists(path.join(repoRoot, "tests", "fixtures", "action.html"), path.join(testRoot, "action.html"));

const prompt = [
  "Use $codex-spark-delegate, but do not operate any browser or desktop app in this smoke test.",
  "Return the structured handoff you would send for a read-only Browser Use task.",
  `Target URL: file://${path.join(testRoot, "index.html")}`,
  "Task: read the page title and the Ready button text.",
  "Use TRACE_ID spark-smoke-001, TOOL_SURFACE browser-use, reasoning effort low, and no side effects.",
  "Do not spawn another agent in this non-interactive smoke; this validates the installed skill instructions only.",
].join("\n");

const result = await run("codex", [
  "exec",
  "--ephemeral",
  "--skip-git-repo-check",
  "--dangerously-bypass-approvals-and-sandbox",
  "-m",
  "gpt-5.3-codex-spark",
  "-c",
  "model_reasoning_effort=\"high\"",
  "-C",
  testRoot,
  prompt,
]);

await writeFile(outputPath, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}\n`);
const combined = `${result.stdout}\n${result.stderr}`;

if (result.code !== 0) {
  if (
    combined.includes("failed to lookup address information") ||
    combined.includes("error sending request for url")
  ) {
    console.error("codex exec started, but outbound Codex API access was unavailable");
  }
  console.error(`codex exec failed with code ${result.code}`);
  console.error(`see ${outputPath}`);
  process.exit(result.code ?? 1);
}

const required = ["TASK:", "TRACE_ID", "TOOL_SURFACE", "browser-use", "VERIFY", "LIMITS"];
const missing = required.filter((token) => !combined.includes(token));
if (missing.length > 0) {
  console.error(`codex exec smoke output missing: ${missing.join(", ")}`);
  console.error(`see ${outputPath}`);
  process.exit(1);
}

const manifest = JSON.parse(await readFile(path.join(pluginTarget, ".codex-plugin", "plugin.json"), "utf8"));
if (manifest.name !== "codex-spark") {
  console.error("staged local plugin manifest mismatch");
  process.exit(1);
}

console.log(`local exec smoke passed in ${testRoot}`);
