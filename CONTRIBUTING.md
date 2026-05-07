# Contributing to Codex Spark

This project is intentionally narrow: it packages a Codex skill that helps
the main session delegate concrete Computer Use and Browser Use tasks to
GPT-5.3 Codex Spark subagents with traceable handoffs.

## Scope

- Keep the plugin focused on main-session delegation and trace quality.
- Do not add domain-specific executors such as X, Reddit, or Gmail posting
  agents to this plugin. Those belong in separate plugins or downstream
  skills.
- Do not add API, scraping, or headless-browser shortcuts as replacements
  for a requested Computer Use or Browser Use surface.
- Keep `SKILL.md` concise. Move detailed contract material, validation
  prompts, examples, or test fixtures into
  `plugins/codex-spark/skills/codex-spark-delegate/references/` or top-level
  `examples/`.

## Development

Requirements:

- Node.js 18.18 or later (only for running validators and the local smoke).
- Codex CLI with an active login.
- Codex plugins, skills, subagents, Computer Use, and Browser Use available
  in the target Codex session for live tests.

Run:

```bash
npm test
npm run test:local
```

`npm run test:local` creates an external test project under
`/tmp/codex-spark-plugin-test` and runs a non-interactive Codex smoke.

## PR Checks

- Update `README.md` for user-facing behavior changes.
- Update `docs/ARCHITECTURE.md` when the handoff, trace, model, or
  testing contract changes.
- Add or update tests for manifest, marketplace, or skill contract
  changes. The validators in `tests/` intentionally mirror the public
  contract; they are not optional.
- Add a `## [Unreleased]` entry to `CHANGELOG.md` for any user-visible
  change. The release workflow refuses to tag a version without a
  matching CHANGELOG section.
- Do not include local Codex state, logs, plugin cache directories, or
  generated smoke artifacts in commits.

## Releases

Release flow:

1. Move the relevant `## [Unreleased]` notes under a new
   `## [x.y.z] - YYYY-MM-DD` section in `CHANGELOG.md`.
2. Bump `version` in `plugins/codex-spark/.codex-plugin/plugin.json` and
   `package.json`.
3. `npm test` must pass.
4. Tag and push: `git tag vX.Y.Z && git push origin vX.Y.Z`.
5. The `Release` workflow extracts the matching CHANGELOG section and
   creates a GitHub Release.

## Security

Do not file public issues for vulnerabilities. See `SECURITY.md`.
