---
name: codex-spark-delegate
description: Use when the main Codex session should delegate a concrete Computer Use or Browser Use task to a GPT-5.3 Codex Spark subagent with a structured handoff and traceable result.
---

# Codex Spark Delegate

Use this skill from the main session when a user wants Codex to operate a visible app, desktop browser, or browser page and the work can be delegated as one concrete executor task.

The main session remains responsible for understanding the user request, confirming exact side effects, choosing the tool surface, spawning the subagent, and resolving failures. The spark subagent is an executor, not a planner.

## Use When

- The task is primarily UI operation: click, type, navigate, inspect, capture evidence, fill a form, post approved content, or verify a browser/app state.
- The user explicitly asks for Computer Use, Browser Use, desktop/browser automation, or spark delegation.
- The action can be described with exact target, inputs, limits, and verification checks.

Do not use this skill for architecture decisions, code review, open-ended debugging, copywriting, or tasks where the delegate would need to invent content or make product decisions.

## Tool Surface

Choose exactly one surface before spawning:

- `computer-use`: desktop apps or a real logged-in browser profile. Use this for app switching, Chrome/Safari sessions, native dialogs, rich-text sites, accounts, or any workflow where the visible Mac session is the source of truth.
- `browser-use`: in-app browser inspection of local or web pages. Use this for localhost QA, screenshots, simple navigation, form checks without desktop account state, or when the user explicitly asks for Browser Use.

Do not let the subagent swap surfaces. If the requested surface is unavailable, it must abort and report what was missing.

## Model Choice

Default to:

- model: `gpt-5.3-codex-spark`
- reasoning effort: `high`

Reasoning effort may be lowered only when the task is simple and low risk:

- `low`: one or two read-only checks with no login, form entry, files, or side effects.
- `medium`: bounded multi-step navigation or data collection with no external side effect.
- `high`: default and recommended for logged-in sessions, forms, non-ASCII text entry, uploads, publish/send/submit actions, flaky UI, or any task where recovery matters.
- `xhigh`: rare; use only when the task is still executor-shaped but unusually fragile.

If the parent session does not have access to `gpt-5.3-codex-spark`, the spawned subagent will abort with status `aborted` and a `model_unavailable` blocker. The parent may fall back to another model the session can spawn, but trace quality will reflect that model's executor profile, not Spark's.

## Parent Workflow

1. Restate the user request as one executable task. If there are multiple independent tasks, spawn separate subagents only after confirming they will not contend for the same app or browser session.
2. Confirm exact side effects before spawning. For publish, send, submit, delete, purchase, account, or bulk actions, the handoff must include `APPROVAL: parent confirmed exact action and content`.
3. Pick `computer-use` or `browser-use`; do not leave the choice to the child.
4. Create a `TRACE_ID` such as `spark-YYYYMMDD-HHMMSS-short-slug`.
5. Spawn one `default` subagent with `model = "gpt-5.3-codex-spark"` and the chosen `reasoning_effort`. Pass only the structured handoff plus the executor instructions below. For the spawn call, use either `message` or `items`, never both; prefer one plain `message` string unless attachments are required.
6. Wait for the result when the next main-session decision depends on it.
7. Read the returned trace without remapping, normalizing, or summarizing away schema problems. If the child returned an out-of-enum status such as `passed`, `done`, or `success`, preserve the raw value and report it as a trace contract violation. If the child aborted, reported mismatch, or left uncertainty, the main session decides the recovery path; do not ask the child to improvise a second attempt without narrowing the cause.

## Handoff Template

Use this exact section structure. Keep values concrete.

```text
TASK: <one executable UI/browser action>
TRACE_ID: <stable id for this run>
TOOL_SURFACE: <computer-use or browser-use>
TARGET: <app/browser/site/url/window/account expectation>
CONTENT: <exact text, file paths, form values, or read-only>
EXECUTION: <model gpt-5.3-codex-spark, reasoning effort, parent approval signal if side effect>
VERIFY: <visible-state checks, exact-match checks, screenshots/evidence needed>
LIMITS: <timeout, max items, no-goals, stop conditions>
REPORT: Return the trace shape from this skill; do not summarize away failed checks or remap status values.
```

For risky text entry — non-ASCII, CJK, emoji, or rich-text editors — require the validated clipboard + `press_key` path and never literal `type_text` shortcut strings such as `<cmd+v>` or `\t`. The full contract, fallbacks, and trace requirements are in [`references/text-entry-guide.md`](references/text-entry-guide.md).

## Executor Instructions To Include

Include this compact instruction block after the handoff:

```text
You are a GPT-5.3 Codex Spark executor. Do not redesign the task, draft content, choose a different account, broaden scope, or use a different tool surface.

First validate TASK, TRACE_ID, TOOL_SURFACE, TARGET, CONTENT, VERIFY, and LIMITS. Abort before tool use if required fields are missing or if a side effect lacks explicit parent approval.

For TOOL_SURFACE=computer-use, use Codex Computer Use only. Start with tool-name discovery when the surface is not already visible: list or search available tool names for Computer Use operations such as `list_apps` and `get_app_state`, then call only exposed tools by their real names. Do not call `resources/list` or any MCP resource lookup against guessed server names such as `mcp__computer_use__`. After discovery, try the real Computer Use app/state preflight. Abort if the app or state cannot be read. Do not use web search, HTTP, headless browser, or in-app browser as a substitute.

For TOOL_SURFACE=browser-use, use the Browser Use plugin only. Start with tool-name discovery when the surface is not already visible: list or search available tool names for Browser Use navigation, state, and screenshot operations, then call only exposed tools by their real names. Do not call `resources/list` or any MCP resource lookup against guessed server names such as `mcp__browser_use__`. Abort if browser-use navigation, state, or screenshot tools are unavailable. Do not substitute desktop Computer Use unless the handoff says TOOL_SURFACE=computer-use.

Before every click/type/submit decision, re-read the current UI state. Do not rely on stale coordinates, memory, or guessed DOM state. For keyboard shortcuts, use the Computer Use `press_key` tool, never literal `type_text` shortcut strings. For non-ASCII or rich-text entry, follow `references/text-entry-guide.md`: clipboard + `press_key` with exact-match verification; `set_value` is acceptable only for plain native or accessibility text inputs and must be reported in the trace.

Return a structured trace with status, trace_id, tool_surface, target, model_config, steps, observations, verification, artifacts, blockers, and next_step. The `status` value must be exactly one of `succeeded`, `blocked`, `aborted`, `partial`, `side_effect_unverified`, or `failed`; do not use synonyms such as `passed`, `done`, or `success`. If a side effect happened but final verification failed, say so explicitly and include the visible evidence.
```

## Return Shape

Require the child to return this shape:

```text
status: succeeded | blocked | aborted | partial | side_effect_unverified | failed
trace_id: <TRACE_ID>
tool_surface: computer-use | browser-use
target: <what was actually operated>
model_config: gpt-5.3-codex-spark / <effort>
steps:
  - <short ordered action log>
observations:
  - <live UI states read before important actions>
verification:
  - check: <expected>
    result: pass | fail | unknown
    evidence: <visible text, URL, screenshot note, app state, etc.>
artifacts:
  - <paths, URLs, screenshots, post ids, or none>
blockers:
  - <missing tool, login, mismatch, modal, permission, timeout, or none>
next_step: <what the main session should do next>
```

The main session should preserve this trace in its final answer or a local run note when the task had external side effects.

Do not remap invalid child statuses into valid ones. Preserve the raw child status and call out the contract violation so the next iteration can fix the delegate prompt or runtime behavior.

Use `blocked` when the subagent did not perform the requested UI work because a required tool, app, login state, permission, target, or approval was unavailable. Use `aborted` when the subagent stopped because the handoff itself was invalid or unsafe.

For trace quality, the child must name any fallback that affected confidence, such as using `set_value` instead of clipboard paste for a plain input, leaving a disposable tab open, or being unable to capture a screenshot artifact.

## References

- [`references/text-entry-guide.md`](references/text-entry-guide.md) — clipboard + `press_key` contract for non-ASCII and rich-text entry.
