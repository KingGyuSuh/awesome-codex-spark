# Codex Spark Delegate Test Prompts

Use these prompts to validate that the skill produces a concrete handoff, spawns GPT-5.3 Codex Spark, and gets a traceable result.

## Read-only Browser Use

```text
Use $codex-spark-delegate.
Task: open the local test page, report the visible title and button text, and do not click anything.
Tool surface: browser-use.
Target: file://<ABSOLUTE_PATH_TO_TEST_PAGE>
Limits: read-only, max 1 page, no network.
Verify: exact visible title "Codex Spark Test Page" and button text "Ready".
```

## Read-only Computer Use

```text
Use $codex-spark-delegate.
Task: inspect the visible Google Chrome state and report whether a window is available.
Tool surface: computer-use.
Target: Google Chrome desktop app.
Limits: read-only, no navigation, no typing, no side effects.
Verify: app state was read or a concrete unavailable reason was returned.
```

## Approved Form Fill

```text
Use $codex-spark-delegate.
Task: fill the local test page input with the exact text and click the Save button.
Tool surface: browser-use.
Target: file://<ABSOLUTE_PATH_TO_TEST_PAGE>
Content: "codex spark approved form value"
Execution: APPROVAL: parent confirmed exact action and content.
Limits: one form submission only, no network.
Verify: visible saved value equals "codex spark approved form value".
```
