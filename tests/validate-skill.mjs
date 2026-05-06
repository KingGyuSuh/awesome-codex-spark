import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const skillDir = path.join(root, "skills", "codex-spark-delegate");
const skillPath = path.join(skillDir, "SKILL.md");
const text = await readFile(skillPath, "utf8");

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function assert(condition, message) {
  if (!condition) fail(message);
}

const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---/);
assert(frontmatterMatch, "SKILL.md must start with YAML frontmatter");

const frontmatter = Object.fromEntries(
  frontmatterMatch?.[1]
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const index = line.indexOf(":");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }) ?? [],
);

assert(frontmatter.name === "codex-spark-delegate", "skill name mismatch");
assert(frontmatter.description?.includes("Computer Use"), "description must mention Computer Use");
assert(frontmatter.description?.includes("Browser Use"), "description must mention Browser Use");
assert(frontmatter.description?.includes("GPT-5.3 Codex Spark"), "description must mention GPT-5.3 Codex Spark");

const requiredPhrases = [
  "model: `gpt-5.3-codex-spark`",
  "reasoning effort: `high`",
  "TOOL_SURFACE: <computer-use or browser-use>",
  "APPROVAL: parent confirmed exact action and content",
  "use either `message` or `items`, never both",
  "press_key",
  "never literal `type_text` shortcut strings",
  "Start with tool-name discovery",
  "Do not call `resources/list`",
  "do not use synonyms such as `passed`, `done`, or `success`",
  "Do not remap invalid child statuses",
  "structured trace",
  "status: succeeded | blocked | aborted | partial | side_effect_unverified | failed",
];

for (const phrase of requiredPhrases) {
  assert(text.includes(phrase), `SKILL.md missing required phrase: ${phrase}`);
}

assert(existsSync(path.join(skillDir, "references", "test-prompts.md")), "test prompts reference is missing");
assert(existsSync(path.join(skillDir, "references", "text-entry-guide.md")), "text-entry-guide reference is missing");
assert(existsSync(path.join(skillDir, "agents", "openai.yaml")), "agents/openai.yaml is missing");

const textEntryGuide = await readFile(path.join(skillDir, "references", "text-entry-guide.md"), "utf8");
for (const phrase of ["pbcopy", "press_key", "exact-match", "set_value"]) {
  assert(textEntryGuide.includes(phrase), `text-entry-guide.md missing required phrase: ${phrase}`);
}

if (!process.exitCode) {
  console.log("codex-spark-delegate skill is valid");
}
