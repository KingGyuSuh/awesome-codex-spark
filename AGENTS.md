# AGENTS.md

Guidance for Codex (and other coding agents) working on this repository.

## What this repo is

A Codex plugin that packages one main-session skill, `$codex-spark-delegate`,
which instructs the parent Codex session to delegate one concrete Computer
Use or Browser Use task to a `gpt-5.3-codex-spark` subagent and require a
structured trace back.

## Layout

```text
.agents/plugins/marketplace.json                                       repo-local marketplace, source.path → ./plugins/codex-spark
plugins/codex-spark/.codex-plugin/plugin.json                          plugin manifest (required)
plugins/codex-spark/skills/codex-spark-delegate/SKILL.md               main-session skill
plugins/codex-spark/skills/codex-spark-delegate/references/            validation prompts and text-entry guide
plugins/codex-spark/skills/codex-spark-delegate/agents/openai.yaml     UI metadata for the skill
plugins/codex-spark/assets/                                            logo, composer icon, screenshot
examples/                                                              end-to-end usage recipes
docs/                                                                  architecture and live trace evidence
plugin.schema.json                                                     advisory JSON Schema for the manifest
tests/                                                                 static validators + non-interactive smoke
```

## Load-bearing rules

- Follow the official Codex plugin structure: the plugin tree lives under `plugins/codex-spark/`, with `.codex-plugin/plugin.json` as the manifest and `skills/` at the plugin root. Marketplace `source.path` resolves to `./plugins/codex-spark`. Relative paths inside the manifest start with `./`.
- Custom `.codex/agents/*.toml` files cannot currently be bundled inside a plugin. The skill must spawn a `default` subagent with explicit `model = "gpt-5.3-codex-spark"` and a chosen `reasoning_effort`.
- Default reasoning effort is `high`. Use `low` or `medium` only for clearly simpler read-only work.
- The parent session chooses exactly one tool surface before spawning: `computer-use` or `browser-use`. The child does not swap surfaces.
- Side effects require an explicit parent approval signal (`APPROVAL: parent confirmed exact action and content`) in the handoff.
- The child must return trace evidence: status, steps, observations, verification, artifacts, blockers, and next step.
- For non-ASCII or rich-text entry, the validated path is clipboard + `press_key` with exact-match verification. Never type literal shortcut strings through `type_text`. The full contract is in `plugins/codex-spark/skills/codex-spark-delegate/references/text-entry-guide.md`.

## Editing rules for agents

- Do not introduce a registry, npm CLI, install script, packs directory, or harness state in this tree. The production tree intentionally excludes them. `tests/validate-production.mjs` enforces this.
- Do not add domain-specific executors (X poster, Reddit poster, Gmail sender, etc.) to this plugin. Those belong in separate plugins.
- Keep `SKILL.md` concise. Long-form contract material goes under `plugins/codex-spark/skills/codex-spark-delegate/references/`.
- Update `CHANGELOG.md` under `## [Unreleased]` for any user-visible change. The release workflow expects a versioned entry to exist before tagging.
- When the manifest, marketplace, or skill contract changes, update the matching validator in `tests/`.

## Testing

```bash
npm test            # static validators (Node 18 / 20 / 22)
npm run test:local  # non-interactive codex exec smoke under /tmp/codex-spark-plugin-test
```

Manual plugin testing still needs the Codex plugin directory:

```bash
codex plugin marketplace add "$PWD"
codex
/plugins
```

Install `codex-spark`, restart Codex, then use `$codex-spark-delegate` in a fresh thread.
