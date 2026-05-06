# Example: Korean (or any non-ASCII) text entry through clipboard paste

This recipe shows the validated path for entering rich-text or non-ASCII
content through Computer Use without corruption.

## Why a special path

Direct `type_text` of CJK or emoji characters is unreliable in
Computer Use because the IME state and per-keystroke composition are
not under the executor's control. The validated path is:

1. Put the exact text on the macOS clipboard with `pbcopy`.
2. Focus the visible target input.
3. Use the Computer Use `press_key` tool with `super+v`. Do not type
   the literal string `<cmd+v>` or `super+v` as text.
4. Read back the visible value and verify exact match before any
   submit/send/publish action.

## Parent prompt

```text
Use $codex-spark-delegate.
Task: enter the exact Korean string into the visible input on the
local action page, click Save, and verify the visible saved text.
Tool surface: computer-use.
Target: file:///tmp/codex-spark-plugin-test/action.html
Content: "코덱스 스파크 한글 입력 003"
Execution: APPROVAL: parent confirmed exact action and content.
model gpt-5.3-codex-spark, reasoning effort high.
Limits: one save action, do not navigate away, do not modify other inputs.
Verify: input value and visible saved text both exactly match Content
character-for-character.
```

## Required executor behavior

- `pbcopy` the exact text. Do not paraphrase or add quotes.
- `press_key super+v` (Computer Use tool), not `type_text "super+v"`.
- Exact-match verification reads the visible UI; it does not trust the
  intent of the paste.
- If `press_key` is unavailable, `set_value` is allowed only for a plain
  native or accessibility text input. For rich-text editors or any
  publish/send surface, the executor must abort with status `blocked`
  and `next_step: parent installs press_key-capable Computer Use`.

## What "good" looks like

```text
status: succeeded
verification:
  - check: input value exact-match
    result: pass
    evidence: "코덱스 스파크 한글 입력 003"
  - check: visible saved text exact-match
    result: pass
    evidence: "코덱스 스파크 한글 입력 003"
artifacts:
  - press_key shortcut tool used: super+v
  - fallback used: none
```

If the `fallback used` field shows anything other than `none`, the
parent must read the trace carefully — a fallback to `set_value` on a
plain input is acceptable, but a fallback that silently used
`type_text` for the shortcut is a contract break and the parent should
re-issue with stricter executor instructions.
