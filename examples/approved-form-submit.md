# Example: approved form fill with explicit parent approval

This recipe shows how to delegate a side-effecting form submission to
`gpt-5.3-codex-spark` while keeping approval and content under parent
control.

## When to use it

- The exact form values are known and approved before delegation.
- The form has a single Save/Submit action.
- You want the executor to verify the visible saved state, not just
  the click outcome.

## Parent prompt

```text
Use $codex-spark-delegate.
Task: fill the visible Settings form on http://localhost:3000/settings
with the exact approved value and click Save.
Tool surface: browser-use.
Target: http://localhost:3000/settings
Content: "Codex Spark approved 2026-05"
Execution: APPROVAL: parent confirmed exact action and content.
Limits: one form submission only, no navigation away from the target page,
no extra fields modified.
Verify: visible saved value exactly matches Content; Save button reaches
its post-save state (e.g. disabled, "Saved" toast, or persisted value
on reload).
```

## Trace expectations

```text
status: succeeded | side_effect_unverified
verification:
  - check: form value before submit
    result: pass
    evidence: input.value === "Codex Spark approved 2026-05"
  - check: post-save visible state
    result: pass | unknown
    evidence: <toast text, persisted value, or unknown reason>
artifacts:
  - screenshot of the post-save state (if available)
```

## Why parent approval is load-bearing

`APPROVAL: parent confirmed exact action and content` is the contract
the executor checks before any submit click. If that line is missing,
the spark subagent must abort with status `aborted` and `next_step:
parent re-issue handoff with explicit approval`.

## Why `side_effect_unverified` exists

If Save click fired but the page navigated, errored, or the toast
disappeared before exact-match read, the executor must use
`side_effect_unverified` rather than `succeeded`. The parent then
decides whether to re-open the page and re-verify, or undo the change.
