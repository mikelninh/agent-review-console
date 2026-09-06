# ARCHITECTURE

## System shape

```text
Reviewer
   │
   ▼
React / TypeScript web app
   │  REST + SSE
   ▼
FastAPI service
   ├─ workflow state machine
   ├─ deterministic demo agent
   ├─ evidence/provenance service
   ├─ decision service
   └─ audit event service
        │
        ▼
Synthetic fixtures
```

## Frontend responsibilities

- render workflow progress and partial results
- make latency and failures legible
- expose evidence next to claims
- surface uncertainty without false precision
- enforce explicit human review before final decision
- render agent-driven next actions from typed backend state

## Backend responsibilities

- own canonical workflow state
- emit typed progress events
- keep deterministic demo behaviour reproducible
- validate decisions and transitions
- preserve evidence references
- produce structured audit events

## Key design choices

- **SSE over WebSockets for V1:** workflow updates are primarily server → client and SSE keeps the demo architecture simpler.
- **Typed state machine over free-form agent loop:** user-facing states must be inspectable and testable.
- **Fixtures first:** the proof should run without external infrastructure or secrets.
- **Human authority:** agents may recommend and prepare; the reviewer owns the final decision.
- **Failure as product state:** dependency errors are represented explicitly rather than hidden behind generic exceptions.

## Target repository shape

```text
apps/
  web/
  api/
fixtures/
evals/
tests/
evidence/
.ai-build/
.github/workflows/
AGENTS.md
```
