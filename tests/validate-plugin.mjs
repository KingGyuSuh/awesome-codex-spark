import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

const manifestPath = path.join(root, ".codex-plugin", "plugin.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

assert(manifest.name === "codex-spark", "plugin name must be codex-spark");
assert(/^\d+\.\d+\.\d+$/.test(manifest.version), "plugin version must be semver");
assert(typeof manifest.description === "string" && manifest.description.length > 20, "description is required");
assert(manifest.skills === "./skills/", "manifest must point skills to ./skills/");
assert(existsSync(path.join(root, "skills", "codex-spark-delegate", "SKILL.md")), "codex-spark-delegate skill is missing");
assert(!existsSync(path.join(root, ".codex-plugin", "skills")), "only plugin.json belongs under .codex-plugin");

assert(isObject(manifest.interface), "interface metadata is required for open-source install surfaces");
assert(manifest.interface.displayName === "Codex Spark", "displayName mismatch");
assert(typeof manifest.interface.shortDescription === "string" && manifest.interface.shortDescription.length > 0, "interface.shortDescription is required");
assert(typeof manifest.interface.longDescription === "string" && manifest.interface.longDescription.length > 0, "interface.longDescription is required");
assert(typeof manifest.interface.category === "string" && manifest.interface.category.length > 0, "interface.category is required");
assert(Array.isArray(manifest.interface.capabilities), "interface.capabilities must be an array");

const documentedCapabilities = new Set(["Read", "Write"]);
for (const capability of manifest.interface.capabilities) {
  assert(
    documentedCapabilities.has(capability),
    `interface.capabilities contains undocumented value: ${capability} (documented: Read, Write)`,
  );
}
assert(/^#[0-9A-Fa-f]{6}$/.test(manifest.interface.brandColor ?? ""), "interface.brandColor must be #RRGGBB");
assert(Array.isArray(manifest.interface.defaultPrompt), "defaultPrompt must be an array");
assert(manifest.interface.defaultPrompt.length <= 3, "defaultPrompt must include at most 3 entries");
for (const prompt of manifest.interface.defaultPrompt) {
  assert(typeof prompt === "string" && prompt.length <= 128, "each defaultPrompt must be a <=128 char string");
}

for (const assetField of ["composerIcon", "logo"]) {
  const value = manifest.interface?.[assetField];
  if (value) {
    assert(value.startsWith("./"), `interface.${assetField} must be a relative path starting with ./`);
    assert(existsSync(path.join(root, value)), `interface.${assetField} points to missing file: ${value}`);
  }
}
if (Array.isArray(manifest.interface.screenshots)) {
  for (const shot of manifest.interface.screenshots) {
    assert(typeof shot === "string" && shot.startsWith("./"), `each screenshot must be a relative path starting with ./`);
    assert(existsSync(path.join(root, shot)), `screenshot points to missing file: ${shot}`);
  }
}

const marketplacePath = path.join(root, ".agents", "plugins", "marketplace.json");
const marketplace = JSON.parse(await readFile(marketplacePath, "utf8"));
const entry = marketplace.plugins?.find((plugin) => plugin.name === manifest.name);
assert(entry, "repo marketplace must expose codex-spark");
assert(entry.source?.source === "local", "marketplace source must be local");
assert(entry.source?.path === "./", "root-source plugin marketplace path must be ./");
assert(entry.policy?.installation === "AVAILABLE", "marketplace installation policy must be AVAILABLE");
assert(entry.policy?.authentication === "ON_INSTALL", "marketplace authentication policy must be ON_INSTALL");
assert(typeof entry.category === "string" && entry.category.length > 0, "marketplace category is required");

if (!process.exitCode) {
  console.log("plugin manifest and marketplace are valid");
}
