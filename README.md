# Agent Review Console

**A trustworthy human-in-the-loop interface for regulated agentic AI.**

Agent Review Console is a focused proof of work for one hard product problem: how do you let AI agents move quickly while keeping evidence, uncertainty, failures and human accountability visible?

The demo follows a synthetic third-party risk review from evidence retrieval to recommendation, human decision and audit trail. It is intentionally small, deterministic and inspectable.

## What this proves

- streaming agent progress instead of a generic spinner
- source-level evidence and provenance
- human-in-the-loop review and override
- explicit uncertainty and missing-evidence handling
- recoverable degraded states
- auditable decision history
- React/TypeScript frontend + FastAPI backend
- deterministic demo mode with no model/API key required

## Golden path

`Open case → run review → inspect evidence → review recommendation → approve/override → audit trail`

A second path deliberately fails one dependency so recovery behaviour can be inspected rather than merely described.

## Status

Foundation commit. Product implementation follows immediately.
