import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const ignoredLocalOnlyPaths = new Set([".codex", ".harness", "tmp"]);

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function assert(condition, message) {
  if (!condition) fail(message);
}

const removedPaths = [
  "cli",
  "packs",
  "release",
  "tmp",
  ".codex",
  ".harness",
  "registry.json",
  "registry.schema.json",
  "goal-post-to-x-live-hardening.md",
  "goal-x-posting-subagents.md",
  "report-issue-x.md",
];

for (const relativePath of removedPaths) {
  if (!existsSync(path.join(root, relativePath))) {
    continue;
  }

  const isIgnoredLocalOnly = ignoredLocalOnlyPaths.has(relativePath);
  const isPublishable = packageJson.files?.includes(relativePath);
  assert(
    isIgnoredLocalOnly && !isPublishable,
    `production tree must not include publishable ${relativePath}`,
  );
}

const requiredPublicFiles = [
  "README.md",
  "AGENTS.md",
  "CHANGELOG.md",
  "LICENSE",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "CODE_OF_CONDUCT.md",
  "package.json",
  "plugin.schema.json",
  ".codex-plugin/plugin.json",
  ".agents/plugins/marketplace.json",
  "docs/ARCHITECTURE.md",
  "docs/VALIDATION.md",
  "skills/codex-spark-delegate/SKILL.md",
  "skills/codex-spark-delegate/references/test-prompts.md",
  "skills/codex-spark-delegate/references/text-entry-guide.md",
  "skills/codex-spark-delegate/agents/openai.yaml",
  "examples/qa-local-nextjs.md",
  "examples/approved-form-submit.md",
  "examples/korean-clipboard-paste.md",
  "assets/logo.svg",
  "assets/composer-icon.svg",
  "assets/screenshot-1.svg",
  ".github/workflows/test.yml",
  ".github/workflows/release.yml",
];

for (const relativePath of requiredPublicFiles) {
  assert(existsSync(path.join(root, relativePath)), `required public file is missing: ${relativePath}`);
}

const scannedFiles = [
  "README.md",
  "AGENTS.md",
  "LICENSE",
  "package.json",
  ".codex-plugin/plugin.json",
  ".agents/plugins/marketplace.json",
  "docs/ARCHITECTURE.md",
  "docs/VALIDATION.md",
  "skills/codex-spark-delegate/SKILL.md",
];

const forbiddenPatterns = [
  /TODO/i,
  /<user>/i,
  /placeholder/i,
  /codex-spark add/,
  /registry\.schema\.json/,
  /registry-backed npm CLI/i,
  /old `packs/i,
  /Legacy Pack Experiment/i,
];

for (const relativePath of scannedFiles) {
  const text = await readFile(path.join(root, relativePath), "utf8");
  for (const pattern of forbiddenPatterns) {
    assert(!pattern.test(text), `${relativePath} contains forbidden production text: ${pattern}`);
  }
}

assert(packageJson.private === true, "package.json must set private: true (this repo is a Codex plugin, not an npm package)");

const changelog = await readFile(path.join(root, "CHANGELOG.md"), "utf8");
const manifest = JSON.parse(await readFile(path.join(root, ".codex-plugin", "plugin.json"), "utf8"));
assert(
  changelog.includes(`## [${manifest.version}]`),
  `CHANGELOG.md is missing an entry for the current manifest version ${manifest.version}`,
);

if (!process.exitCode) {
  console.log("production tree is clean");
}
