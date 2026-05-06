# Text Entry Guide

Detailed guidance for risky text entry through Computer Use. The main
SKILL.md keeps the executor instructions compact; this guide is the
long-form reference and is part of the validated contract.

## Why this matters

Computer Use side effects are hardest to undo when text gets corrupted
mid-paste — a half-pasted post can still publish, a partially-typed CJK
string can confuse the IME, and a literal shortcut string can be sent
to the wrong field. The validated executor path eliminates all three.

## Validated path (clipboard + press_key)

1. **`pbcopy` the exact text.** No quoting, no escaping, no adding a
   trailing newline that the input did not already have.
2. **Focus the visible target input.** Read live UI state to confirm
   the focused field is the intended one.
3. **`press_key super+v`** through the Computer Use `press_key` tool.
   The tool name is `press_key`. The argument is the shortcut. Do not
   type the literal string `<cmd+v>`, `super+v`, or `\t` through
   `type_text`.
4. **Exact-match read.** Read the input value (or the persisted
   visible text after submit) and assert character-for-character match
   against the original Content. Do not trust paste success based on
   focus state alone.
5. **Only then proceed to submit/send/publish.**

## Surfaces and fallbacks

| Surface | Allowed input path | Notes |
|---|---|---|
| Plain native or accessibility text input | clipboard + `press_key`, or `set_value` | `set_value` is acceptable but must be reported in `artifacts.fallback`. |
| Rich-text editor (Slack, X composer, Notion-like) | clipboard + `press_key` only | `set_value` typically fails to set composed state correctly and may silently lose formatting. |
| Publish/send/submit field | clipboard + `press_key` only | Never use `set_value` here, even on a plain input; the post-action visible state is more important than the pre-action input state, but the input state should still be exact-match-verified. |

## Anti-patterns

- Typing the literal string `<cmd+v>` through `type_text`.
- Using `type_text` to enter Korean, Japanese, Chinese, or emoji
  characters one at a time.
- Skipping the exact-match read because the paste "looked fine".
- Re-using a stale screenshot to verify post-save state.

## Trace requirements

The executor's trace must include, for any non-ASCII or rich-text
entry:

- `verification`: a check entry whose `evidence` shows the exact text
  read from visible UI.
- `artifacts.fallback`: the literal string `none` if the validated
  path was used end to end. Any deviation must be named here (for
  example, `set_value on plain input because press_key was
  unavailable`). A missing `fallback` field on a non-trivial entry
  task is itself a contract break and the parent should re-issue.

## Live evidence

The path documented above is the same path that produced
`spark-live-computer-korean-003` in
[`docs/VALIDATION.md`](../../../docs/VALIDATION.md). An earlier trace
`spark-live-computer-korean-002` succeeded only because the target was
a plain accessibility input that tolerated `set_value`; that trace
exposed the literal-shortcut anti-pattern and led to the press_key
contract this guide encodes.
