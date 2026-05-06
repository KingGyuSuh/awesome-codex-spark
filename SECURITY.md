# Security Policy

## Supported Versions

Only the latest published version of Codex Spark is supported. Apply updates
promptly.

## Reporting a Vulnerability

Please report security issues privately through GitHub Security Advisories for
this repository:

https://github.com/KingGyuSuh/awesome-codex-spark/security/advisories/new

Do not open a public issue for security reports.

You can expect acknowledgement within 7 days and a fix or mitigation plan within
30 days for confirmed issues.

## Threat Model

Codex Spark is an instruction plugin. It does not store credentials, call
external APIs directly, or implement its own browser automation layer.

The primary risks are delegated UI side effects:

- publishing or sending unapproved content,
- operating the wrong account or app window,
- submitting a form before visible exact-match verification,
- hiding a partial failure behind a vague success summary.

The skill mitigates those risks by requiring parent approval signals for side
effects, a single selected tool surface, fresh UI-state reads before important
actions, exact-match verification, and a structured trace that the main session
can audit.

## Trace handling and PII

The structured trace returned by the spark subagent intentionally captures
visible UI evidence — URLs, form values, button labels, screenshot notes — so
the parent session can audit and recover from partial failures. Some of that
evidence may include personal information, account handles, draft content,
or session-specific URLs.

If you intend to share a trace publicly (in a bug report, a blog post, a
support thread), redact the relevant evidence first. The trace shape is
designed to be human-readable, so redaction is a manual review, not a
schema transformation.
