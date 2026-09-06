# DECISIONS

Architecture and product decisions are recorded here so agent-generated implementation remains explainable and reversible.

## ADR-001 — Decision interface, not chatbot

**Status:** Accepted

The primary UX is a structured review workspace. Conversational interaction may be added later, but it must not hide workflow state, provenance, uncertainty or human authority.

## ADR-002 — Deterministic demo mode first

**Status:** Accepted

The portfolio demo must run without external model credentials. A deterministic agent simulator is the reference implementation for the golden and degraded paths. Optional live-model integration must preserve the same typed contracts.

## ADR-003 — SSE for workflow progress

**Status:** Accepted

Use server-sent events for V1 because updates are predominantly server-to-client, browser support is strong, and failure/reconnect behaviour is easier to explain than a richer bidirectional transport.

## ADR-004 — Typed workflow state machine

**Status:** Accepted

User-facing agent progress is represented by explicit states and transitions rather than opaque free-form reasoning. This improves testability, observability and recovery semantics.

## ADR-005 — Human owns final decision

**Status:** Accepted

The system may retrieve, analyse and recommend. It may not finalize the regulated decision without an explicit reviewer action.

## ADR-006 — Synthetic third-party risk case

**Status:** Accepted

Use a fictional company and synthetic evidence. The demo should illustrate regulated financial-services interaction patterns without implying access to Deutsche Bank systems or confidential processes.
