# Validation

Validation is split between public static checks, maintainer-only local smoke,
marketplace loading, and manual live UI checks. Normal use is interactive:
install through `/plugins`, restart Codex, then invoke `$codex-spark-delegate`
from the Codex CLI or Codex app.

## Static Checks

```bash
npm test
python3 /path/to/skill-creator/scripts/quick_validate.py skills/codex-spark-delegate
```

Current coverage:

- `.codex-plugin/plugin.json` parses, points `skills` at `./skills/`, and keeps
  all bundled paths relative to the plugin root.
- `.agents/plugins/marketplace.json` exposes `codex-spark` with local source
  `./`, install policy, authentication policy, and category.
- `skills/codex-spark-delegate/SKILL.md` has valid frontmatter and includes the
  required model, reasoning effort, handoff, approval, surface, text-entry, and
  trace-status contract.
- `tests/validate-production.mjs` rejects publishable retired artifacts such as
  registries, CLIs, packs, harness state, and stale production wording.

Latest local result:

```text
plugin manifest and marketplace are valid
codex-spark-delegate skill is valid
production tree is clean
Skill is valid!
```

## External Project Smoke

```bash
CODEX_SPARK_TEST_ROOT=../test-codex-awesome npm run test:local
```

This maintainer smoke creates a disposable external project, stages this repo as
a local Codex plugin, writes an external marketplace file, mirrors the exact
installed skill for `codex exec`, and checks that the model emits the required
handoff sections: `TASK`, `TRACE_ID`, `TOOL_SURFACE`, `VERIFY`, and `LIMITS`.

Latest local result:

```text
local exec smoke passed in ../test-codex-awesome
```

This smoke does not replace interactive `/plugins` installation or live
Computer Use / Browser Use checks. It is a fast contract check for the packaged
skill text.

## Marketplace CLI

```bash
codex plugin marketplace add /path/to/awesome-codex-spark
codex plugin marketplace remove awesome-codex-spark
```

Current coverage:

- `codex plugin marketplace add` registers the repo marketplace.
- `codex plugin marketplace remove` removes that temporary marketplace entry.
- Local marketplace upgrade is not a release gate because Codex treats local
  marketplace roots differently from Git-backed marketplaces.

## Manual Live Checks

Manual checks should be run from a fresh interactive Codex thread after the
plugin is installed through `/plugins`.

Required scenarios:

- Browser Use read-only target: if Browser Use is unavailable in the child
  runtime, return `blocked` with the missing tool surface and no fallback to
  Computer Use, shell, HTTP, web search, or a headless browser.
- Computer Use preflight: discover real Computer Use tools, read the target app
  state, and make no clicks, typing, navigation, or file changes.
- Approved local action: after an explicit
  `APPROVAL: parent confirmed exact action and content`, fill one local test
  field, click one local Save button, and verify the visible result exactly.
- Korean clipboard paste: put exact Korean content on the clipboard, focus the
  target input, use `press_key super+v`, verify input and saved text exactly,
  and report `fallback used: none`.

Every child trace must use one of these exact statuses:

```text
succeeded | blocked | aborted | partial | side_effect_unverified | failed
```

Out-of-enum values such as `success`, `passed`, `PASS`, or `done` are trace
contract violations. The parent must preserve the raw value and report the
contract break instead of remapping it.
