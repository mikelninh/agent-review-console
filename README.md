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

## How I Build

This repository follows a six-stage **AI Build OS** designed for agentic software development where agents can implement substantial parts of the system without owning product intent, risk boundaries or the definition of success.

### 01 — SHAPE
**Problem → user → constraints → architecture**

Understand the real workflow before writing code. Define the user, consequential decisions, constraints and system shape.

### 02 — SPECIFY
**Requirements → boundaries → acceptance criteria**

Turn intent into explicit contracts: what the system must do, what it must not do, and what evidence will count as success.

### 03 — DELEGATE
**Agents execute within explicit autonomy limits**

Agents implement inside documented boundaries. Product scope, consequential decisions and safety-critical changes remain human-owned.

### 04 — PROVE
**Tests → evals → benchmarks → adversarial cases**

Claims are backed by executable verification. Golden paths, degraded paths, unsupported evidence and human overrides become regression cases.

### 05 — SHIP
**CI → deployment gates → production**

A green local demo is not enough. Automated gates enforce the repository contract and implementation quality before release.

### 06 — WATCH
**Traces → logs → regressions → feedback**

Once shipped, observed behaviour feeds back into tests, evals, architecture decisions and the next iteration.

## Repository operating system

```text
.ai-build/
├── SPEC.md
├── ARCHITECTURE.md
├── DECISIONS.md
├── ACCEPTANCE.md
├── AUTONOMY.md
├── EVALS.md
├── RUNBOOK.md
└── RETROSPECTIVE.md

AGENTS.md

evals/
tests/
evidence/
.github/workflows/
```

The important idea is simple: **code is only one artifact of the build.** The specification, autonomy boundaries, verification evidence and operational feedback are part of the product too.

## Status

AI Build OS foundation complete. Product implementation follows against explicit acceptance criteria.
