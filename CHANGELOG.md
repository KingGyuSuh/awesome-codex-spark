# Changelog

All notable changes to Codex Spark are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Plugin tree lives under `plugins/codex-spark/`. Marketplace
  `source.path` resolves to `./plugins/codex-spark`.
- Marketplace identifier in `.agents/plugins/marketplace.json` is
  `awesome-codex-spark-marketplace`, distinct from the repository slug.
- Validators and the `codex exec` smoke read from the new tree;
  `package.json` `files` and the doc set follow the same path.
- Maintainer-only manual prompts moved from
  `plugins/codex-spark/skills/codex-spark-delegate/references/test-prompts.md`
  to `docs/test-prompts.md`. SKILL.md no longer references them, and the
  skill bundle now contains only runtime-required material.

### Fixed

- `references/text-entry-guide.md` link to `docs/VALIDATION.md` resolves
  correctly from the new plugin tree depth.

## [0.1.0] - 2026-05-07

Initial open-source release.

### Added
- Codex plugin manifest at `.codex-plugin/plugin.json` with full
  `interface` metadata (`displayName`, `shortDescription`,
  `longDescription`, `category`, `capabilities`, `defaultPrompt`,
  `brandColor`, `composerIcon`, `logo`, `screenshots`).
- One main-session skill, `codex-spark-delegate`, that instructs the
  parent Codex session to delegate one concrete Computer Use or Browser
  Use task to a `gpt-5.3-codex-spark` subagent and require a structured
  trace back.
- Skill UI metadata at `skills/codex-spark-delegate/agents/openai.yaml`.
- Repo-local marketplace at `.agents/plugins/marketplace.json` for
  `codex plugin marketplace add "$PWD"` testing.
- Visual assets: `assets/logo.svg`, `assets/composer-icon.svg`,
  `assets/screenshot-1.svg`.
- Static validators: `validate-plugin.mjs`, `validate-skill.mjs`,
  `validate-production.mjs`.
- Non-interactive `codex exec` smoke at
  `tests/run-local-exec-smoke.mjs`, which stages this repo as a local
  Codex plugin under `/tmp/codex-spark-plugin-test`.
- Reference and example bundles: `references/test-prompts.md`,
  `references/text-entry-guide.md`, and three end-to-end scenarios under
  `examples/`.
- JSON schema for the manifest at `plugin.schema.json` (advisory; not
  enforced by Codex but useful for editor validation).
- GitHub Actions: `test.yml` (Node 18 / 20 / 22 matrix), `release.yml`
  (publish a GitHub Release on `v*` tag push).
- Validation notes in `docs/VALIDATION.md` covering static validators,
  external-project smoke, local marketplace loading, and live Browser Use /
  Computer Use scenarios.

### Changed
- Tightened the executor tool-discovery contract so delegated agents list or
  search available tool names before Computer Use or Browser Use preflight, and
  do not probe guessed MCP resource server names such as `mcp__computer_use__`.
- Tightened trace reporting so parents use a single spawn payload shape,
  preserve raw child statuses, and flag out-of-enum values instead of remapping
  them to `succeeded`.
- Scoped production-tree checks to publishable content while still rejecting
  retired registries, packs, CLIs, harness state, and other forbidden artifacts.
- Clarified that `codex exec` is only a maintainer smoke test; normal plugin use
  is interactive `/plugins` installation plus `$codex-spark-delegate`.

### Notes
- Self-serve marketplace publishing on the official OpenAI marketplace
  is reported as "coming soon" by the Codex docs at the time of this
  release. Until it ships, install via `codex plugin marketplace add`
  pointed at a local clone of this repository.
- Custom subagent TOML files cannot currently be bundled inside a
  plugin, so this plugin spawns a `default` subagent with explicit
  `model = "gpt-5.3-codex-spark"` instead of shipping a `.codex/agents`
  file.

[Unreleased]: https://github.com/KingGyuSuh/awesome-codex-spark/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/KingGyuSuh/awesome-codex-spark/releases/tag/v0.1.0
