# Architecture

Codex Spark is a Codex plugin that packages one main-session skill:
`$codex-spark-delegate`.

The plugin does not try to ship a static custom agent file. Current Codex
plugin packaging documents skills, app integrations, MCP servers, hooks,
and assets as plugin components; custom subagent TOML files remain
standalone Codex configuration. Instead, the skill tells the main
session to spawn a `default` subagent with:

- model: `gpt-5.3-codex-spark`
- reasoning effort: `high` by default, with lower efforts allowed for
  simple read-only tasks
- one structured handoff containing target, content, tool surface,
  limits, and verification requirements

## Flow

```text
   user
    │
    │ "verify the Save button on /settings"
    ▼
┌──────────────────┐    1. confirm scope, side effect, approval
│  parent session  │    2. choose tool surface
│  (reasoning)     │    3. mint TRACE_ID
└──────────────────┘    4. spawn default subagent
    │                       model: gpt-5.3-codex-spark
    │ structured handoff    reasoning_effort: high
    ▼
┌──────────────────┐    5. validate handoff fields
│  spark child     │    6. operate ONLY the chosen surface
│  (executor)      │    7. read live UI before each action
└──────────────────┘    8. exact-match verify
    │
    │ structured trace
    ▼
┌──────────────────┐    9. audit trace, recover, or accept
│  parent session  │
└──────────────────┘
    │
    ▼
   user
```

## Trace status values

- `succeeded`: requested UI work completed and verification passed.
- `blocked`: the child could not start or finish because a required
  tool, app, login, permission, target, or approval was unavailable.
- `aborted`: the handoff was invalid, ambiguous, or unsafe.
- `partial`: bounded work completed but not all requested checks could
  be done.
- `side_effect_unverified`: an external side effect may have happened,
  but final visible verification failed or stayed unknown.
- `failed`: the child attempted the task and hit an execution failure.

## Why the trace is load-bearing

Computer Use and Browser Use failures are often recoverable only by the
main session because the parent has the user context, approval state,
and broader goal. The child must therefore return enough evidence to
diagnose:

- what UI state it actually saw,
- what actions it took,
- which checks passed, failed, or stayed unknown,
- whether any external side effect happened,
- what the parent should do next.

Text entry fallbacks are especially important. For non-ASCII or
rich-text surfaces, the intended path is `pbcopy` plus Computer Use
`press_key` paste and visible exact-match verification. The full
contract, fallbacks, and trace requirements live in
[`skills/codex-spark-delegate/references/text-entry-guide.md`](../skills/codex-spark-delegate/references/text-entry-guide.md).
A child must not represent shortcut strings through literal typing. If
it falls back to `set_value`, that is acceptable only for plain
accessibility text inputs and must be reported in the trace.

## Repo layout

```text
.codex-plugin/plugin.json                       plugin manifest
skills/codex-spark-delegate/SKILL.md            main-session skill
skills/codex-spark-delegate/references/         long-form contract material
skills/codex-spark-delegate/agents/openai.yaml  UI metadata
.agents/plugins/marketplace.json                repo-local marketplace
assets/                                         logo, composer icon, screenshot
examples/                                       end-to-end usage recipes
docs/                                           architecture + live trace evidence
plugin.schema.json                              advisory manifest schema
tests/                                          validators + non-interactive smoke
```

## Local plugin testing

`tests/run-local-exec-smoke.mjs` creates an external project under
`/tmp/codex-spark-plugin-test`, stages this repository as a local
plugin, writes a local marketplace file, and mirrors the exact plugin
skill into `.agents/skills` for a non-interactive `codex exec` smoke.

The direct skill mirror is intentional: Codex marketplace discovery and
plugin installation are interactive surfaces in the CLI. The smoke
verifies the same SKILL.md instructions in a fresh project without
mutating the user's plugin cache. Full manual install testing should
still use the Codex plugin directory:

```bash
codex plugin marketplace add /path/to/awesome-codex-spark
codex
/plugins
```

Then install `codex-spark`, restart Codex, and invoke:

```text
Use $codex-spark-delegate to run a read-only Browser Use check on a local page.
```
