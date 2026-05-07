# Codex Spark

[![Test](https://github.com/KingGyuSuh/awesome-codex-spark/actions/workflows/test.yml/badge.svg)](https://github.com/KingGyuSuh/awesome-codex-spark/actions/workflows/test.yml)
[![License](https://img.shields.io/github/license/KingGyuSuh/awesome-codex-spark.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.18-brightgreen.svg)](https://nodejs.org)
[![Codex CLI](https://img.shields.io/badge/codex--cli-%3E%3D0.128.0-10A37F.svg)](https://developers.openai.com/codex)

Codex plugin for delegating concrete Computer Use and Browser Use tasks to GPT-5.3 Codex Spark subagents with structured handoffs and auditable traces.

The plugin packages one main-session skill: `$codex-spark-delegate`. The skill keeps the reasoning-heavy parent session in charge of scope, approval, model effort, and recovery, while a spark subagent performs one bounded UI/browser task as an executor.

## Why

Codex Spark is useful when the main session should not spend its attention on mechanical UI work: opening a page, reading visible state, filling approved form values, clicking through a bounded flow, or checking a local browser surface.

The child agent must return a trace: what it saw, what it did, which checks passed, what artifacts exist, and what the parent should do next. That trace is load-bearing because the parent has to resolve login problems, approval gaps, mismatches, or partial side effects.

## What This Is Not

This plugin is intentionally narrow. It is **not**:

- a domain executor (no built-in X poster, Reddit poster, Gmail sender — those belong in separate plugins);
- a substitute for a missing surface (it does not silently fall back to web search, HTTP, or a headless browser when Browser Use is unavailable);
- a planner (the spark child does not decide content, accounts, or scope — the parent does).

## What It Installs

```text
.codex-plugin/plugin.json
skills/codex-spark-delegate/SKILL.md
skills/codex-spark-delegate/references/test-prompts.md
skills/codex-spark-delegate/references/text-entry-guide.md
skills/codex-spark-delegate/agents/openai.yaml
assets/logo.svg
assets/composer-icon.svg
assets/screenshot-1.svg
```

Current Codex plugin docs package skills, app integrations, MCP servers, hooks, and assets. Custom subagent TOML files are still standalone Codex configuration, so this plugin does not pretend to auto-install a static `.codex/agents` file. Instead, the skill tells the parent session to spawn a `default` subagent with:

- model: `gpt-5.3-codex-spark`
- reasoning effort: `high` by default
- `medium` or `low` only for simpler read-only work
- one structured handoff covering `TASK`, `TRACE_ID`, `TOOL_SURFACE`, `TARGET`, `CONTENT`, `EXECUTION`, `VERIFY`, `LIMITS`, and `REPORT`

## Requirements

- Codex CLI `0.128.0` or later with an active login.
- macOS, if you intend to use Computer Use. Browser Use works cross-platform.
- Access to the `gpt-5.3-codex-spark` model in your Codex session. Without it, the spawned subagent returns a `aborted` trace with a `model_unavailable` blocker; the parent may fall back to another model, with the caveat that trace quality reflects that model's executor profile, not Spark's.
- Node.js `>=18.18` only if you plan to run the bundled validators (`npm test`) or the local exec smoke (`npm run test:local`). The plugin itself does not require Node at runtime.

## Install

This repo ships its own in-session marketplace at `.agents/plugins/marketplace.json`, with the plugin tree at the repo root (`.codex-plugin/plugin.json`). Self-serve publishing on the official Codex plugin marketplace is reported as "coming soon" by the OpenAI docs, but the marketplace file works today through any of the three sources below. Pick one, then `/plugins` → open the `Awesome Codex Spark` entry → install `codex-spark` → restart Codex.

### Public Git Repo (recommended)

GitHub shorthand — no clone, no path management:

```bash
codex plugin marketplace add KingGyuSuh/awesome-codex-spark
codex
/plugins
```

### Pinned Tag

For reproducible installs against a specific release:

```bash
codex plugin marketplace add KingGyuSuh/awesome-codex-spark@<tag>
codex
/plugins
```

### Local Clone

For contributors developing the plugin in-tree, or anyone who wants to install from a checkout:

```bash
git clone https://github.com/KingGyuSuh/awesome-codex-spark.git
cd awesome-codex-spark
codex plugin marketplace add "$PWD"
codex
/plugins
```

Once `codex-spark` is installed, invoke from any Codex thread:

```text
Use $codex-spark-delegate to run a read-only Browser Use check on http://localhost:3000.
```

## Usage

Three end-to-end recipes live under [`examples/`](examples/):

- [`examples/qa-local-nextjs.md`](examples/qa-local-nextjs.md) — read-only QA pass on a localhost dev server.
- [`examples/approved-form-submit.md`](examples/approved-form-submit.md) — approved form fill with explicit parent approval.
- [`examples/korean-clipboard-paste.md`](examples/korean-clipboard-paste.md) — validated clipboard + `press_key` path for Korean and other non-ASCII entry.

A minimal read-only Browser Use handoff:

```text
Use $codex-spark-delegate.
Task: inspect http://localhost:3000/settings and report whether the Save button is enabled.
Tool surface: browser-use.
Limits: read-only, no clicks, one page only.
Verify: return visible URL, button label, enabled/disabled state, and screenshot note if available.
```

A minimal approved Computer Use handoff:

```text
Use $codex-spark-delegate.
Task: paste the exact approved post text into the visible X composer and stop before publishing.
Tool surface: computer-use.
Target: Google Chrome, logged-in X account @example.
Content: "Exact approved text"
Execution: APPROVAL: parent confirmed exact action and content. Stop before final publish click.
Verify: visible composer text exactly matches Content.
```

## Validation

This plugin is validated at three levels:

- static validators for manifest, marketplace, skill contract, and production
  tree shape;
- an external-project `codex exec` maintainer smoke that checks the installed
  skill produces the required handoff sections;
- manual live checks for Browser Use blocked-path behavior, Computer Use
  preflight, a local approved action, and Korean clipboard paste.

Full validation notes: [`docs/VALIDATION.md`](docs/VALIDATION.md).

## Troubleshooting

**Spark child reports `model_unavailable`.** Your Codex session does not have access to `gpt-5.3-codex-spark`. Either request access or rewrite the handoff to use a model you can spawn — note that trace quality changes accordingly.

**Browser Use surface returns `blocked` immediately.** The Browser Use plugin is not installed in the same Codex session. Install Browser Use, restart, and re-issue. The skill is designed to surface this rather than silently fall back to Computer Use or HTTP.

**Korean / CJK / emoji input becomes garbled.** The executor used `type_text` instead of clipboard + `press_key`. Re-issue the handoff and quote [`text-entry-guide.md`](skills/codex-spark-delegate/references/text-entry-guide.md) explicitly. The validated path is `pbcopy` → `press_key super+v` → exact-match read.

**Trace says `succeeded` but the side effect did not actually land.** Look for `side_effect_unverified` in the trace next time — it is a documented status. If you saw `succeeded` despite an unconfirmed side effect, the executor skipped the post-action visible read, which is a contract break. File an issue with the trace.

**`/plugins` does not show the plugin tile.** Confirm the `marketplace add` source resolves to a tree that contains `.agents/plugins/marketplace.json`: for the local-clone path, that means running the command from the repo root (not a sibling directory); for the GitHub shorthand path, that means using the `KingGyuSuh/awesome-codex-spark` slug exactly. Restart Codex after install in either case.

## Development

```bash
npm test
npm run test:local
```

`npm test` runs the static validators (`validate-plugin`, `validate-skill`, `validate-production`).

`npm run test:local` creates `/tmp/codex-spark-plugin-test`, stages this repository as a local Codex plugin, writes a local marketplace file, mirrors the exact skill into the external test project for non-interactive ephemeral `codex exec`, and checks that the skill produces the expected structured handoff.

Manual live tests should additionally install the plugin through `/plugins` and run disposable Browser Use or Computer Use tasks from a fresh Codex thread.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Validation](docs/VALIDATION.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Changelog](CHANGELOG.md)
- Manifest schema: [`plugin.schema.json`](plugin.schema.json) (advisory; for editor and CI validation)

Official Codex docs used for this shape:

- [Build plugins](https://developers.openai.com/codex/plugins/build)
- [Agent Skills](https://developers.openai.com/codex/skills)
- [Subagents](https://developers.openai.com/codex/subagents)
- [Use your computer with Codex](https://developers.openai.com/codex/use-cases/use-your-computer-with-codex)

## License

[MIT](LICENSE).
