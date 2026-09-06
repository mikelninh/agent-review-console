# SPEC — Agent Review Console

## Problem

Agentic AI in regulated workflows is hard to trust when users cannot see what the system is doing, what evidence supports a recommendation, where uncertainty remains, or when a human must take control.

## Primary user

A reviewer/assessor responsible for approving or rejecting a third-party risk case.

## Product goal

Make an agentic review workflow feel fast, inspectable, recoverable and accountable without overwhelming the reviewer.

## Golden case

A synthetic vendor review for **Acme Payments GmbH**:

1. Open case.
2. Run agent workflow.
3. Stream visible step progress.
4. Inspect cited evidence.
5. Review recommendation and uncertainty.
6. Approve, edit, request evidence or reject.
7. Record the decision in an audit trail.
8. Demonstrate one dependency failure and recovery path.

## Functional requirements

- React/TypeScript web interface.
- FastAPI backend.
- Server-sent events or equivalent streaming transport for run progress.
- Deterministic `DEMO_MODE` that requires no external model/API key.
- Source-level evidence with document/page provenance.
- Human-in-the-loop decision controls.
- Explicit incomplete/missing evidence states.
- Recoverable degraded run with retry of failed step.
- Immutable-looking audit event timeline in the demo UX.
- Responsive and accessible enough for keyboard-first review workflows.

## Non-goals

- Real Deutsche Bank systems or branding.
- Real customer/vendor data.
- Production authentication/authorization.
- Production-grade document ingestion.
- A general-purpose chat assistant.
- Autonomous final approval of regulated decisions.
- Large multi-agent orchestration for its own sake.

## Core product principle

**This is a decision interface, not a chatbot.** Every material AI assertion should expose status, provenance, uncertainty and a clear path to human control.
