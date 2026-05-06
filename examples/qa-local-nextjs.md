# Example: read-only QA pass on a local Next.js dev server

This recipe shows how the parent session delegates a bounded read-only
inspection to `gpt-5.3-codex-spark` through `$codex-spark-delegate`.

## When to use it

- The dev server is running locally on `http://localhost:3000`.
- You want to verify visible UI state, not poke server internals.
- You do not want the executor to click anything or submit forms.

## Parent prompt

```text
Use $codex-spark-delegate.
Task: open http://localhost:3000/settings, report the visible page title,
the visible Save button label, and whether Save is enabled or disabled.
Tool surface: browser-use.
Limits: read-only, max 1 page, no clicks, no network beyond the target URL.
Verify: visible URL exactly matches the target, button label is read from
visible UI text, enabled/disabled state is read from accessible state and
not guessed.
```

## Expected trace shape

The child should return roughly:

```text
status: succeeded
tool_surface: browser-use
target: http://localhost:3000/settings
model_config: gpt-5.3-codex-spark / low
steps:
  - navigate
  - read page title
  - read Save button label
  - read Save button enabled state
verification:
  - check: visible URL matches target
    result: pass
    evidence: http://localhost:3000/settings
  - check: Save button label
    result: pass
    evidence: "Save"
  - check: Save button enabled state
    result: pass
    evidence: aria-disabled=false
artifacts: none
blockers: none
next_step: parent decides whether to run an interactive QA pass
```

## Recovery cases the parent must handle

- Browser Use surface unavailable in the child runtime → status `blocked`
  with `next_step: parent installs the Browser Use plugin`.
- Local server returned 404 or hung → status `partial` with the visible
  error and the parent decides whether to restart the dev server.

## Why this is a good spark task

It is concrete, bounded, and the executor never needs to reason about
content. The parent retains every decision that requires user context.
